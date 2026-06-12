<?php
require_once __DIR__ . '/../helpers.php';

setCORSHeaders();

$payload = requireAuth();
$userId  = $payload['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action  = $_GET['action'] ?? null;
$db      = getDB();

// ── Création automatique de la table accounts ─────────────────────────────────
$db->exec("
    CREATE TABLE IF NOT EXISTS accounts (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        user_id         INT NOT NULL,
        name            VARCHAR(100) NOT NULL,
        type            ENUM('courant','epargne','livret','especes','investissement','autre') NOT NULL DEFAULT 'courant',
        icon            VARCHAR(10)  NOT NULL DEFAULT '',
        color           VARCHAR(30)  NOT NULL DEFAULT 'primary',
        initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
");

// Ajouter la colonne account_id aux transactions si elle n'existe pas encore
try {
    $db->exec("ALTER TABLE transactions ADD COLUMN account_id INT NULL DEFAULT NULL");
    $db->exec("CREATE INDEX idx_transactions_account_id ON transactions (account_id)");
} catch (PDOException $e) {
    // Colonne déjà présente — on ignore
}

const ALLOWED_ACCOUNT_TYPES = ['courant', 'epargne', 'livret', 'especes', 'investissement', 'autre'];

function castAccount(array $a): array {
    $a['id']              = (int)$a['id'];
    $a['initial_balance'] = (float)$a['initial_balance'];
    $a['balance']         = (float)($a['balance'] ?? $a['initial_balance']);
    $a['tx_count']        = (int)($a['tx_count'] ?? 0);
    return $a;
}

// Requête avec calcul du solde réel (initial + flux des transactions)
function accountsQuery(PDO $db, int $userId, ?int $id = null): array {
    $where = $id ? 'a.user_id = ? AND a.id = ?' : 'a.user_id = ?';
    $params = $id ? [$userId, $id] : [$userId];

    $stmt = $db->prepare("
        SELECT
            a.*,
            a.initial_balance + COALESCE(
                SUM(CASE
                    WHEN t.type = 'revenu'  THEN  t.amount
                    WHEN t.type = 'depense' THEN -t.amount
                    ELSE 0
                END), 0
            ) AS balance,
            COUNT(t.id) AS tx_count
        FROM accounts a
        LEFT JOIN transactions t ON t.account_id = a.id
        WHERE {$where}
        GROUP BY a.id
        ORDER BY a.created_at ASC
    ");
    $stmt->execute($params);
    return $stmt->fetchAll();
}

// ─── GET /api/accounts.php ───────────────────────────────────────────────────
if ($method === 'GET' && !$id) {
    jsonResponse(array_map('castAccount', accountsQuery($db, $userId)));
}

// ─── GET /api/accounts.php?id=X ─────────────────────────────────────────────
if ($method === 'GET' && $id) {
    $rows = accountsQuery($db, $userId, $id);
    if (empty($rows)) errorResponse('Compte introuvable', 404);
    jsonResponse(castAccount($rows[0]));
}

// ─── POST /api/accounts.php?action=transfer ──────────────────────────────────
// Crée un virement interne entre deux comptes (deux transactions liées)
if ($method === 'POST' && $action === 'transfer') {
    $body = getBody();

    foreach (['from_account_id', 'to_account_id', 'amount', 'date'] as $f) {
        if (!isset($body[$f]) || $body[$f] === '') errorResponse("Champ « $f » requis");
    }

    $fromId = (int)$body['from_account_id'];
    $toId   = (int)$body['to_account_id'];
    if ($fromId === $toId) errorResponse('Les deux comptes doivent être différents');

    $amount = validateAmount($body['amount'], 'amount');
    validateDate($body['date'], 'date');

    $description = isset($body['description']) && trim($body['description']) !== ''
        ? sanitizeStr($body['description'], 255)
        : 'Virement interne';

    // Vérifier que les deux comptes appartiennent à l'utilisateur
    $stmt = $db->prepare('SELECT id FROM accounts WHERE id IN (?, ?) AND user_id = ?');
    $stmt->execute([$fromId, $toId, $userId]);
    if ($stmt->rowCount() !== 2) errorResponse('Compte(s) introuvable(s)', 404);

    // Transaction de débit (source)
    $stmt = $db->prepare('
        INSERT INTO transactions (user_id, description, amount, type, category, date, notes, account_id)
        VALUES (?, ?, ?, "depense", "autre", ?, "Virement interne", ?)
    ');
    $stmt->execute([$userId, $description, $amount, $body['date'], $fromId]);

    // Transaction de crédit (destination)
    $stmt = $db->prepare('
        INSERT INTO transactions (user_id, description, amount, type, category, date, notes, account_id)
        VALUES (?, ?, ?, "revenu", "autre", ?, "Virement interne", ?)
    ');
    $stmt->execute([$userId, $description, $amount, $body['date'], $toId]);

    jsonResponse(['success' => true, 'amount' => $amount], 201);
}

// ─── POST /api/accounts.php ──────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();

    if (!isset($body['name']) || trim($body['name']) === '') errorResponse("Champ « name » requis");
    $name = sanitizeStr($body['name'], 100);

    $type = $body['type'] ?? 'courant';
    validateEnum($type, ALLOWED_ACCOUNT_TYPES, 'type');

    $icon  = sanitizeStr($body['icon']  ?? '🏦', 10);
    $color = sanitizeStr($body['color'] ?? 'primary', 30);

    $initialBalance = 0.0;
    if (isset($body['initial_balance']) && $body['initial_balance'] !== '') {
        $initialBalance = (float)$body['initial_balance'];
        if ($initialBalance < -99_999_999 || $initialBalance > 99_999_999) {
            errorResponse('Solde initial invalide');
        }
    }

    $stmt = $db->prepare('
        INSERT INTO accounts (user_id, name, type, icon, color, initial_balance)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([$userId, $name, $type, $icon, $color, $initialBalance]);
    $newId = (int)$db->lastInsertId();

    $rows = accountsQuery($db, $userId, $newId);
    jsonResponse(castAccount($rows[0]), 201);
}

// ─── PUT /api/accounts.php?id=X ─────────────────────────────────────────────
if ($method === 'PUT' && $id) {
    $stmt = $db->prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) errorResponse('Compte introuvable', 404);

    $body = getBody();

    if (!isset($body['name']) || trim($body['name']) === '') errorResponse("Champ « name » requis");
    $name = sanitizeStr($body['name'], 100);

    $type = $body['type'] ?? 'courant';
    validateEnum($type, ALLOWED_ACCOUNT_TYPES, 'type');

    $icon  = sanitizeStr($body['icon']  ?? '🏦', 10);
    $color = sanitizeStr($body['color'] ?? 'primary', 30);

    $initialBalance = 0.0;
    if (isset($body['initial_balance']) && $body['initial_balance'] !== '') {
        $initialBalance = (float)$body['initial_balance'];
        if ($initialBalance < -99_999_999 || $initialBalance > 99_999_999) {
            errorResponse('Solde initial invalide');
        }
    }

    $stmt = $db->prepare('
        UPDATE accounts
        SET name=?, type=?, icon=?, color=?, initial_balance=?, updated_at=NOW()
        WHERE id = ? AND user_id = ?
    ');
    $stmt->execute([$name, $type, $icon, $color, $initialBalance, $id, $userId]);

    $rows = accountsQuery($db, $userId, $id);
    jsonResponse(castAccount($rows[0]));
}

// ─── DELETE /api/accounts.php?id=X ──────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    // Vérifier que le compte appartient à l'utilisateur
    $stmt = $db->prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) errorResponse('Compte introuvable', 404);

    // Interdire la suppression si le compte a des transactions
    $stmt = $db->prepare('SELECT COUNT(*) FROM transactions WHERE account_id = ?');
    $stmt->execute([$id]);
    if ((int)$stmt->fetchColumn() > 0) {
        errorResponse('Impossible de supprimer un compte contenant des transactions. Transférez ou supprimez d\'abord les transactions.', 422);
    }

    $stmt = $db->prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    jsonResponse(['success' => true]);
}

errorResponse('Méthode non supportée', 405);
