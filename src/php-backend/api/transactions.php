<?php
require_once __DIR__ . '/../helpers.php';

setCORSHeaders();

$payload = requireAuth();
$userId  = $payload['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db      = getDB();

function normalizeTx(array $tx): array {
    $tx['id']           = (int)$tx['id'];
    $tx['amount']       = (float)$tx['amount'];
    $tx['is_recurring'] = (int)($tx['is_recurring'] ?? 0);
    $tx['recurrence']   = $tx['recurrence'] ?? null;
    $tx['goal_id']      = isset($tx['goal_id']) && $tx['goal_id'] !== null ? (int)$tx['goal_id'] : null;
    $tx['account_id']	= isset($tx['account_id']) ? (int)$tx['account_id'] : null;
    return $tx;
}

/**
 * Ajuste le current_amount d'un objectif (delta peut être négatif).
 * Met aussi à jour le statut si l'objectif est atteint ou réouvert.
 */
function adjustGoalAmount(PDO $db, int $goalId, int $userId, float $delta): void {
    $stmt = $db->prepare('
        UPDATE goals
        SET
            current_amount = GREATEST(0, LEAST(current_amount + ?, target_amount)),
            status = CASE
                WHEN GREATEST(0, LEAST(current_amount + ?, target_amount)) >= target_amount THEN "atteint"
                WHEN status = "atteint" AND GREATEST(0, LEAST(current_amount + ?, target_amount)) < target_amount THEN "en_cours"
                ELSE status
            END,
            updated_at = NOW()
        WHERE id = ? AND user_id = ?
    ');
    $stmt->execute([$delta, $delta, $delta, $goalId, $userId]);
}

/**
 * Vérifie que le goal appartient à l'utilisateur et est actif.
 * Retourne false si invalide, true si valide.
 */
function validateGoalForUser(PDO $db, int $goalId, int $userId): bool {
    $stmt = $db->prepare("SELECT id FROM goals WHERE id = ? AND user_id = ? AND status = 'en_cours'");
    $stmt->execute([$goalId, $userId]);
    return (bool)$stmt->fetch();
}

/**
 * Vérifie que le compte appartient à l'utilisateur.
 */
function validateAccountForUser(PDO $db, int $accountId, int $userId): bool {
    $stmt = $db->prepare("
        SELECT id
        FROM accounts
        WHERE id = ? AND user_id = ?
    ");

    $stmt->execute([$accountId, $userId]);

    return (bool)$stmt->fetch();
}

// ─── GET /api/transactions.php ───────────────────────────────────────────────
if ($method === 'GET' && !$id) {
    $where  = ['t.user_id = ?'];
    $params = [$userId];

    if (!empty($_GET['type'])) {
        validateEnum($_GET['type'], ALLOWED_TX_TYPES, 'type');
        $where[] = 't.type = ?'; $params[] = $_GET['type'];
    }
    if (!empty($_GET['category'])) {
        validateEnum($_GET['category'], ALLOWED_CATEGORIES, 'category');
        $where[] = 't.category = ?'; $params[] = $_GET['category'];
    }
    if (!empty($_GET['year'])) {
        $y = (int)$_GET['year'];
        if ($y < 1900 || $y > 2200) errorResponse('Année invalide');
        $where[] = 'YEAR(t.date) = ?'; $params[] = $y;
    }
    if (isset($_GET['month']) && $_GET['month'] !== '') {
        $m = (int)$_GET['month'];
        if ($m < 0 || $m > 11) errorResponse('Mois invalide (0-11)');
        $where[] = 'MONTH(t.date) = ?'; $params[] = $m + 1;
    }
    if (isset($_GET['is_recurring']) && $_GET['is_recurring'] !== '') {
        $where[] = 't.is_recurring = ?'; $params[] = (int)$_GET['is_recurring'] ? 1 : 0;
    }
    if (!empty($_GET['search'])) {
        $search = sanitizeStr($_GET['search'], 100);
        $where[] = '(t.description LIKE ? OR t.notes LIKE ?)';
        $like = '%' . $search . '%'; $params[] = $like; $params[] = $like;
    }
    if (isset($_GET['amount_min']) && $_GET['amount_min'] !== '') {
        $min = (float)$_GET['amount_min'];
        if ($min < 0) errorResponse('amount_min ne peut pas être négatif');
        $where[] = 't.amount >= ?'; $params[] = $min;
    }
    if (isset($_GET['amount_max']) && $_GET['amount_max'] !== '') {
        $max = (float)$_GET['amount_max'];
        if ($max < 0) errorResponse('amount_max ne peut pas être négatif');
        $where[] = 't.amount <= ?'; $params[] = $max;
    }
    if (isset($_GET['goal_id']) && $_GET['goal_id'] !== '') {
        $where[] = 't.goal_id = ?'; $params[] = (int)$_GET['goal_id'];
    }
    if (isset($_GET['account_id']) && $_GET['account_id'] !== '') {
        $where[] = 't.account_id = ?';
        $params[] = (int)$_GET['account_id'];
    }

    $sql  = 'SELECT * FROM transactions t WHERE ' . implode(' AND ', $where) . ' ORDER BY t.date DESC, t.id DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(array_map('normalizeTx', $stmt->fetchAll()));
}

// ─── GET /api/transactions.php?id=X ─────────────────────────────────────────
if ($method === 'GET' && $id) {
    $stmt = $db->prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $tx = $stmt->fetch();
    if (!$tx) errorResponse('Transaction introuvable', 404);
    jsonResponse(normalizeTx($tx));
}

// ─── POST /api/transactions.php ──────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();

    foreach (['description', 'amount', 'type', 'category', 'date'] as $f) {
        if (!isset($body[$f]) || $body[$f] === '') errorResponse("Champ « $f » requis");
    }

    $description = sanitizeStr($body['description'], 255);
    if (strlen($description) < 1) errorResponse('La description ne peut pas être vide');

    $amount = validateAmount($body['amount'], 'amount');

    validateEnum($body['type'], ALLOWED_TX_TYPES, 'type');
    validateCategoryForUser($db, $userId, $body['category']);
    validateDate($body['date'], 'date');
    if (empty($body['account_id'])) {
        errorResponse('account_id requis');
    }

    $accountId = (int)$body['account_id'];

    if (!validateAccountForUser($db, $accountId, $userId)) {
        errorResponse('Compte invalide');
    }

    $notes = isset($body['notes']) ? sanitizeStr($body['notes'], 2000) : null;

    $isRecurring = !empty($body['is_recurring']) ? 1 : 0;
    $recurrence  = null;
    if ($isRecurring) {
        if (empty($body['recurrence'])) errorResponse('La fréquence est requise pour une transaction récurrente');
        validateEnum($body['recurrence'], ALLOWED_RECURRENCES, 'recurrence');
        $recurrence = $body['recurrence'];
    }

    // Objectif lié (optionnel)
    $goalId = null;
    if (!empty($body['goal_id'])) {
        $gid = (int)$body['goal_id'];
        if (!validateGoalForUser($db, $gid, $userId)) {
            errorResponse('Objectif invalide ou déjà atteint');
        }
        $goalId = $gid;
    }

    $stmt = $db->prepare('
        INSERT INTO transactions (
            user_id,
            description,
            amount,
            type,
            category,
            date,
            notes,
            is_recurring,
            recurrence,
            goal_id,
            account_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $userId,
        $description,
        $amount,
        $body['type'],
        $body['category'],
        $body['date'],
        $notes,
        $isRecurring,
        $recurrence,
        $goalId,
        $accountId
    ]);
    $newId = (int)$db->lastInsertId();

    // Alimenter l'objectif
    if ($goalId !== null) {
        adjustGoalAmount($db, $goalId, $userId, $amount);
    }

    $stmt2 = $db->prepare('SELECT * FROM transactions WHERE id = ?');
    $stmt2->execute([$newId]);
    jsonResponse(normalizeTx($stmt2->fetch()), 201);
}

// ─── PUT /api/transactions.php?id=X ─────────────────────────────────────────
if ($method === 'PUT' && $id) {
    // Récupérer l'ancienne transaction
    $stmt = $db->prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $old = $stmt->fetch();
    if (!$old) errorResponse('Transaction introuvable', 404);

    $body = getBody();

    $description = sanitizeStr($body['description'] ?? '', 255);
    if (strlen($description) < 1) errorResponse('La description ne peut pas être vide');

    $amount = validateAmount($body['amount'] ?? 0, 'amount');

    validateEnum($body['type'] ?? '', ALLOWED_TX_TYPES, 'type');
    validateCategoryForUser($db, $userId, $body['category'] ?? '');
    validateDate($body['date'] ?? '', 'date');
    if (empty($body['account_id'])) {
        errorResponse('account_id requis');
    }

    $accountId = (int)$body['account_id'];

    if (!validateAccountForUser($db, $accountId, $userId)) {
        errorResponse('Compte invalide');
    }

    $notes = isset($body['notes']) ? sanitizeStr($body['notes'], 2000) : null;

    $isRecurring = !empty($body['is_recurring']) ? 1 : 0;
    $recurrence  = null;
    if ($isRecurring) {
        if (empty($body['recurrence'])) errorResponse('La fréquence est requise pour une transaction récurrente');
        validateEnum($body['recurrence'], ALLOWED_RECURRENCES, 'recurrence');
        $recurrence = $body['recurrence'];
    }

    // Objectif lié (optionnel)
    $newGoalId = null;
    if (!empty($body['goal_id'])) {
        $gid = (int)$body['goal_id'];
        if (!validateGoalForUser($db, $gid, $userId)) {
            errorResponse('Objectif invalide ou déjà atteint');
        }
        $newGoalId = $gid;
    }

    $oldGoalId  = isset($old['goal_id']) && $old['goal_id'] !== null ? (int)$old['goal_id'] : null;
    $oldAmount  = (float)$old['amount'];

    // Mettre à jour la transaction
    $stmt = $db->prepare('
        UPDATE transactions
        SET description=?,
            amount=?,
            type=?,
            category=?,
            date=?,
            notes=?,
            is_recurring=?,
            recurrence=?,
            goal_id=?,
            account_id=?,
            updated_at=NOW()
        WHERE id = ? AND user_id = ?
    ');
    $stmt->execute([
        $description,
        $amount,
        $body['type'],
        $body['category'],
        $body['date'],
        $notes,
        $isRecurring,
        $recurrence,
        $newGoalId,
        $accountId,
        $id,
        $userId
    ]);

    // Ajustements des objectifs
    if ($oldGoalId !== null && $newGoalId !== null && $oldGoalId === $newGoalId) {
        // Même objectif : ajuster la différence
        $delta = $amount - $oldAmount;
        if ($delta != 0) {
            adjustGoalAmount($db, $oldGoalId, $userId, $delta);
        }
    } else {
        // Objectif retiré ou changé : rembourser l'ancien
        if ($oldGoalId !== null) {
            adjustGoalAmount($db, $oldGoalId, $userId, -$oldAmount);
        }
        // Créditer le nouvel objectif
        if ($newGoalId !== null) {
            adjustGoalAmount($db, $newGoalId, $userId, $amount);
        }
    }

    $stmt2 = $db->prepare('SELECT * FROM transactions WHERE id = ?');
    $stmt2->execute([$id]);
    jsonResponse(normalizeTx($stmt2->fetch()));
}

// ─── DELETE /api/transactions.php?id=X ──────────────────────────────────────
if ($method === 'DELETE' && $id) {
    // Récupérer l'objectif lié avant suppression
    $stmt = $db->prepare('SELECT goal_id, amount FROM transactions WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $tx = $stmt->fetch();
    if (!$tx) errorResponse('Transaction introuvable', 404);

    $stmt2 = $db->prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
    $stmt2->execute([$id, $userId]);

    // Soustraire de l'objectif lié
    if ($tx['goal_id'] !== null) {
        adjustGoalAmount($db, (int)$tx['goal_id'], $userId, -(float)$tx['amount']);
    }

    jsonResponse(['success' => true]);
}

errorResponse('Méthode non supportée', 405);
