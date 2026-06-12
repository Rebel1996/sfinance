<?php
require_once __DIR__ . '/../helpers.php';

setCORSHeaders();

$payload = requireAuth();
$userId  = $payload['user_id'];
$method  = $_SERVER['REQUEST_METHOD'];
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db      = getDB();

// ─── GET /api/categories.php ──────────────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $db->prepare(
        'SELECT id, type, value, label FROM user_categories WHERE user_id = ? ORDER BY type, label ASC'
    );
    $stmt->execute([$userId]);
    jsonResponse($stmt->fetchAll());
}

// ─── POST /api/categories.php ─────────────────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();

    if (empty($body['label'])) errorResponse('Le libellé de la catégorie est requis');
    if (empty($body['type']))  errorResponse('Le type (revenu ou depense) est requis');

    validateEnum($body['type'], ALLOWED_TX_TYPES, 'type');

    $label = sanitizeStr($body['label'], 50);
    if (strlen($label) < 1) errorResponse('Le libellé ne peut pas être vide');

    // Générer une clé unique : slug du libellé + suffix court basé sur userId+time
    $slug  = preg_replace('/[^a-z0-9]+/', '_', mb_strtolower($label));
    $slug  = trim($slug, '_') ?: 'cat';
    $value = 'c_' . $slug . '_' . base_convert(crc32($userId . $label . microtime()), 10, 36);

    // Vérifier que le libellé n'existe pas déjà pour cet utilisateur et ce type
    $check = $db->prepare(
        'SELECT id FROM user_categories WHERE user_id = ? AND type = ? AND label = ?'
    );
    $check->execute([$userId, $body['type'], $label]);
    if ($check->fetch()) errorResponse('Cette catégorie existe déjà');

    $stmt = $db->prepare(
        'INSERT INTO user_categories (user_id, type, value, label) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $body['type'], $value, $label]);
    $newId = (int)$db->lastInsertId();

    jsonResponse([
        'id'    => $newId,
        'type'  => $body['type'],
        'value' => $value,
        'label' => $label,
    ], 201);
}

// ─── DELETE /api/categories.php?id=X ─────────────────────────────────────────
if ($method === 'DELETE' && $id) {
    $stmt = $db->prepare('DELETE FROM user_categories WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if ($stmt->rowCount() === 0) errorResponse('Catégorie introuvable', 404);
    jsonResponse(['success' => true]);
}

errorResponse('Méthode non supportée', 405);
