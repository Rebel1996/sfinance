<?php
require_once __DIR__ . '/../helpers.php';

setCORSHeaders();

$payload = requireAuth();
$userId  = $payload['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db      = getDB();

// Créer la table si elle n'existe pas encore
$db->exec("
    CREATE TABLE IF NOT EXISTS goals (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        INT NOT NULL,
        name           VARCHAR(255) NOT NULL,
        description    TEXT,
        target_amount  DECIMAL(15,2) NOT NULL,
        current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        deadline       DATE,
        icon           VARCHAR(10)  DEFAULT '🎯',
        color          VARCHAR(30)  DEFAULT 'primary',
        status         ENUM('en_cours','atteint','abandonne') NOT NULL DEFAULT 'en_cours',
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
");

function castGoal(array $g): array {
    $g['id']             = (int)$g['id'];
    $g['target_amount']  = (float)$g['target_amount'];
    $g['current_amount'] = (float)$g['current_amount'];
    return $g;
}

// ─── GET /api/goals.php ──────────────────────────────────────────────────────
if ($method === 'GET' && !$id) {
    $stmt = $db->prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$userId]);
    jsonResponse(array_map('castGoal', $stmt->fetchAll()));
}

// ─── GET /api/goals.php?id=X ─────────────────────────────────────────────────
if ($method === 'GET' && $id) {
    $stmt = $db->prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $goal = $stmt->fetch();
    if (!$goal) errorResponse('Objectif introuvable', 404);
    jsonResponse(castGoal($goal));
}

// ─── POST /api/goals.php ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();

    foreach (['name', 'target_amount'] as $f) {
        if (!isset($body[$f]) || $body[$f] === '') errorResponse("Champ « $f » requis");
    }

    $name = sanitizeStr($body['name'], 100);
    if (strlen($name) < 1) errorResponse('Le nom de l\'objectif ne peut pas être vide');

    $targetAmount = validateAmount($body['target_amount'], 'target_amount');

    $currentAmount = 0.0;
    if (isset($body['current_amount']) && $body['current_amount'] !== '') {
        $currentAmount = validateAmount($body['current_amount'], 'current_amount', 0, 99_999_999.99);
    }
    if ($currentAmount > $targetAmount) {
        errorResponse('Le montant actuel ne peut pas dépasser le montant cible');
    }

    $deadline = null;
    if (!empty($body['deadline'])) {
        validateDate($body['deadline'], 'deadline');
        $deadline = $body['deadline'];
    }

    $description = isset($body['description']) ? sanitizeStr($body['description'], 500) : null;
    $icon        = sanitizeStr($body['icon']  ?? '🎯', 10);
    $color       = sanitizeStr($body['color'] ?? 'primary', 30);

    $stmt = $db->prepare('
        INSERT INTO goals (user_id, name, description, target_amount, current_amount, deadline, icon, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([$userId, $name, $description, $targetAmount, $currentAmount, $deadline, $icon, $color]);
    $newId = (int)$db->lastInsertId();
    $stmt2 = $db->prepare('SELECT * FROM goals WHERE id = ?');
    $stmt2->execute([$newId]);
    jsonResponse(castGoal($stmt2->fetch()), 201);
}

// ─── PUT /api/goals.php?id=X ─────────────────────────────────────────────────
if ($method === 'PUT' && $id) {
    $stmt = $db->prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) errorResponse('Objectif introuvable', 404);

    $body = getBody();

    // Action spéciale : versement
    if (isset($body['add_amount'])) {
        $add = (float)$body['add_amount'];
        if ($add <= 0) errorResponse('Le versement doit être un montant positif');
        $add = validateAmount($add, 'add_amount');

        $stmt = $db->prepare('
            UPDATE goals
            SET current_amount = LEAST(current_amount + ?, target_amount),
                status = IF(current_amount + ? >= target_amount, "atteint", status),
                updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([$add, $add, $id, $userId]);
        $stmt2 = $db->prepare('SELECT * FROM goals WHERE id = ?');
        $stmt2->execute([$id]);
        jsonResponse(castGoal($stmt2->fetch()));
    }

    // Mise à jour complète
    $name = sanitizeStr($body['name'] ?? '', 100);
    if (strlen($name) < 1) errorResponse('Le nom de l\'objectif ne peut pas être vide');

    $targetAmount  = validateAmount($body['target_amount']  ?? 0, 'target_amount');
    $currentAmount = validateAmount($body['current_amount'] ?? 0, 'current_amount', 0, 99_999_999.99);
    if ($currentAmount > $targetAmount) {
        errorResponse('Le montant actuel ne peut pas dépasser le montant cible');
    }

    $deadline = null;
    if (!empty($body['deadline'])) {
        validateDate($body['deadline'], 'deadline');
        $deadline = $body['deadline'];
    }

    validateEnum($body['status'] ?? 'en_cours', ALLOWED_GOAL_STATUSES, 'status');

    $description = isset($body['description']) ? sanitizeStr($body['description'], 500) : null;
    $icon        = sanitizeStr($body['icon']   ?? '🎯', 10);
    $color       = sanitizeStr($body['color']  ?? 'primary', 30);

    $stmt = $db->prepare('
        UPDATE goals
        SET name=?, description=?, target_amount=?, current_amount=?, deadline=?,
            icon=?, color=?, status=?, updated_at=NOW()
        WHERE id = ? AND user_id = ?
    ');
    $stmt->execute([
        $name, $description, $targetAmount, $currentAmount, $deadline,
        $icon, $color, $body['status'] ?? 'en_cours',
        $id, $userId,
    ]);
    $stmt2 = $db->prepare('SELECT * FROM goals WHERE id = ?');
    $stmt2->execute([$id]);
    jsonResponse(castGoal($stmt2->fetch()));
}

// ─── DELETE /api/goals.php?id=X ──────────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $stmt = $db->prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if ($stmt->rowCount() === 0) errorResponse('Objectif introuvable', 404);
    jsonResponse(['success' => true]);
}

errorResponse('Méthode non supportée', 405);
