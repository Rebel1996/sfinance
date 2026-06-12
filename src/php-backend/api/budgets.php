<?php
require_once __DIR__ . '/../helpers.php';

setCORSHeaders();

$payload = requireAuth();
$userId  = $payload['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db      = getDB();

function normalizeBudget(array $b): array {
    $b['id']     = (int)$b['id'];
    $b['amount'] = (float)$b['amount'];
    if ($b['month'] !== null) $b['month'] = (int)$b['month'];
    $b['year']   = (int)$b['year'];
    return $b;
}

// ─── GET /api/budgets.php ────────────────────────────────────────────────────
if ($method === 'GET' && !$id) {
    $where  = ['user_id = ?'];
    $params = [$userId];

    if (!empty($_GET['year'])) {
        $y = (int)$_GET['year'];
        if ($y < 1900 || $y > 2200) errorResponse('Année invalide');
        $where[] = 'year = ?'; $params[] = $y;
    }
    if (!empty($_GET['period'])) {
        validateEnum($_GET['period'], ALLOWED_BUDGET_PERIODS, 'period');
        $where[] = 'period = ?'; $params[] = $_GET['period'];
    }

    $sql  = 'SELECT * FROM budgets WHERE ' . implode(' AND ', $where) . ' ORDER BY created_at DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(array_map('normalizeBudget', $stmt->fetchAll()));
}

// ─── GET /api/budgets.php?id=X ───────────────────────────────────────────────
if ($method === 'GET' && $id) {
    $stmt = $db->prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $budget = $stmt->fetch();
    if (!$budget) errorResponse('Budget introuvable', 404);
    jsonResponse(normalizeBudget($budget));
}

// ─── POST /api/budgets.php ───────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();

    foreach (['name', 'category', 'amount', 'period', 'year'] as $f) {
        if (!isset($body[$f]) || $body[$f] === '') errorResponse("Champ « $f » requis");
    }

    $name = sanitizeStr($body['name'], 100);
    if (strlen($name) < 1) errorResponse('Le nom du budget ne peut pas être vide');

    $allowedCats = array_merge(ALLOWED_CATEGORIES, ['global']);
    validateEnum($body['category'], $allowedCats, 'category');
    validateEnum($body['period'],   ALLOWED_BUDGET_PERIODS, 'period');

    $amount = validateAmount($body['amount'], 'amount');

    $year = (int)$body['year'];
    if ($year < 1900 || $year > 2200) errorResponse('Année invalide');

    $month = null;
    if ($body['period'] === 'mensuel') {
        if (!isset($body['month']) || $body['month'] === '') errorResponse('Le mois est requis pour un budget mensuel');
        $month = (int)$body['month'];
        if ($month < 0 || $month > 11) errorResponse('Mois invalide (0-11)');
    }

    $stmt = $db->prepare('
        INSERT INTO budgets (user_id, name, category, amount, period, month, year)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([$userId, $name, $body['category'], $amount, $body['period'], $month, $year]);
    $newId = (int)$db->lastInsertId();
    $stmt2 = $db->prepare('SELECT * FROM budgets WHERE id = ?');
    $stmt2->execute([$newId]);
    jsonResponse(normalizeBudget($stmt2->fetch()), 201);
}

// ─── PUT /api/budgets.php?id=X ───────────────────────────────────────────────
if ($method === 'PUT' && $id) {
    $stmt = $db->prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) errorResponse('Budget introuvable', 404);

    $body = getBody();

    $name = sanitizeStr($body['name'] ?? '', 100);
    if (strlen($name) < 1) errorResponse('Le nom du budget ne peut pas être vide');

    $allowedCats = array_merge(ALLOWED_CATEGORIES, ['global']);
    validateEnum($body['category'] ?? '', $allowedCats, 'category');
    validateEnum($body['period']   ?? '', ALLOWED_BUDGET_PERIODS, 'period');

    $amount = validateAmount($body['amount'] ?? 0, 'amount');

    $year = (int)($body['year'] ?? date('Y'));
    if ($year < 1900 || $year > 2200) errorResponse('Année invalide');

    $month = null;
    if (($body['period'] ?? '') === 'mensuel') {
        if (!isset($body['month']) || $body['month'] === '') errorResponse('Le mois est requis pour un budget mensuel');
        $month = (int)$body['month'];
        if ($month < 0 || $month > 11) errorResponse('Mois invalide (0-11)');
    }

    $stmt = $db->prepare('
        UPDATE budgets SET name=?, category=?, amount=?, period=?, month=?, year=?, updated_at=NOW()
        WHERE id = ? AND user_id = ?
    ');
    $stmt->execute([$name, $body['category'], $amount, $body['period'], $month, $year, $id, $userId]);
    $stmt2 = $db->prepare('SELECT * FROM budgets WHERE id = ?');
    $stmt2->execute([$id]);
    jsonResponse(normalizeBudget($stmt2->fetch()));
}

// ─── DELETE /api/budgets.php?id=X ────────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $stmt = $db->prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if ($stmt->rowCount() === 0) errorResponse('Budget introuvable', 404);
    jsonResponse(['success' => true]);
}

errorResponse('Méthode non supportée', 405);
