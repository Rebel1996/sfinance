<?php
require_once __DIR__ . '/../helpers.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ─── POST ?action=register ────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'register') {
    $body  = getBody();
    $name  = sanitizeStr($body['full_name'] ?? '', 100);
    $email = sanitizeStr($body['email']     ?? '', 255);
    $pass  = $body['password'] ?? '';

    if (!$name)  errorResponse('Le nom complet est requis');
    if (!$email) errorResponse('L\'email est requis');
    if (!$pass)  errorResponse('Le mot de passe est requis');

    if (strlen($name) < 2)  errorResponse('Le nom doit contenir au moins 2 caractères');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Email invalide');
    if (strlen($pass) < 8)  errorResponse('Le mot de passe doit faire au moins 8 caractères');
    if (strlen($pass) > 128) errorResponse('Le mot de passe est trop long (128 caractères max)');
    // Exige au moins une lettre et un chiffre
    if (!preg_match('/[A-Za-z]/', $pass) || !preg_match('/[0-9]/', $pass)) {
        errorResponse('Le mot de passe doit contenir au moins une lettre et un chiffre');
    }

    $db = getDB();
    $existing = $db->prepare('SELECT id FROM users WHERE email = ?');
    $existing->execute([strtolower($email)]);
    if ($existing->fetch()) errorResponse('Cet email est déjà utilisé', 409);

    $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $db->prepare('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$name, strtolower($email), $hash]);
    $userId = (int)$db->lastInsertId();

    $accessToken  = generateAccessJWT(['user_id' => $userId, 'email' => $email, 'role' => 'user']);
    $refreshToken = generateRefreshJWT($userId);
    jsonResponse([
        'access_token'  => $accessToken,
        'refresh_token' => $refreshToken,
        'user' => ['id' => $userId, 'full_name' => $name, 'email' => $email, 'role' => 'user', 'avatar_url' => null],
    ], 201);
}

// ─── POST ?action=login ───────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    $body  = getBody();
    $email = sanitizeStr($body['email'] ?? '', 255);
    $pass  = $body['password'] ?? '';

    if (!$email || !$pass) errorResponse('Email et mot de passe requis');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Email invalide');

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([strtolower($email)]);
    $user = $stmt->fetch();

    // Délai constant pour résister au timing attack
    if (!$user || !password_verify($pass, $user['password_hash'])) {
        errorResponse('Email ou mot de passe incorrect', 401);
    }

    $userId       = (int)$user['id'];
    $accessToken  = generateAccessJWT(['user_id' => $userId, 'email' => $user['email'], 'role' => $user['role']]);
    $refreshToken = generateRefreshJWT($userId);
    jsonResponse([
        'access_token'  => $accessToken,
        'refresh_token' => $refreshToken,
        'user' => [
            'id'         => $userId,
            'full_name'  => $user['full_name'],
            'email'      => $user['email'],
            'role'       => $user['role'],
            'avatar_url' => $user['avatar_url'] ?? null,
        ],
    ]);
}

// ─── POST ?action=refresh ─────────────────────────────────────────────────────
// Échange un refresh token valide contre un nouvel access token.
if ($method === 'POST' && $action === 'refresh') {
    $body         = getBody();
    $refreshToken = $body['refresh_token'] ?? '';

    if (!$refreshToken) errorResponse('Refresh token requis', 401);

    $payload = verifyJWT($refreshToken, 'refresh');
    if (!$payload) errorResponse('Refresh token invalide ou expiré', 401);

    $userId = (int)($payload['user_id'] ?? 0);
    $db     = getDB();
    $stmt   = $db->prepare('SELECT id, email, role FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) errorResponse('Utilisateur introuvable', 401);

    $newAccessToken  = generateAccessJWT(['user_id' => $userId, 'email' => $user['email'], 'role' => $user['role']]);
    $newRefreshToken = generateRefreshJWT($userId);

    jsonResponse([
        'access_token'  => $newAccessToken,
        'refresh_token' => $newRefreshToken,
    ]);
}

// ─── GET ?action=me ───────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'me') {
    $payload = requireAuth();
    $db   = getDB();
    $stmt = $db->prepare('SELECT id, full_name, email, role, avatar_url, created_at FROM users WHERE id = ?');
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    if (!$user) errorResponse('Utilisateur introuvable', 404);
    $user['id'] = (int)$user['id'];
    jsonResponse($user);
}

// ─── PUT ?action=update-profile ───────────────────────────────────────────────
if ($method === 'PUT' && $action === 'update-profile') {
    $payload = requireAuth();
    $body    = getBody();
    $name    = sanitizeStr($body['full_name'] ?? '', 100);
    $email   = sanitizeStr($body['email']     ?? '', 255);

    if (!$name || strlen($name) < 2) errorResponse('Le nom doit contenir au moins 2 caractères');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Email invalide');

    $db = getDB();
    $check = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $check->execute([strtolower($email), $payload['user_id']]);
    if ($check->fetch()) errorResponse('Cet email est déjà utilisé par un autre compte', 409);

    $stmt = $db->prepare('UPDATE users SET full_name = ?, email = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$name, strtolower($email), $payload['user_id']]);

    $stmt2 = $db->prepare('SELECT id, full_name, email, role, avatar_url, created_at FROM users WHERE id = ?');
    $stmt2->execute([$payload['user_id']]);
    $user = $stmt2->fetch();
    $user['id'] = (int)$user['id'];
    jsonResponse($user);
}

// ─── PUT ?action=update-password ─────────────────────────────────────────────
if ($method === 'PUT' && $action === 'update-password') {
    $payload      = requireAuth();
    $body         = getBody();
    $current_pass = $body['current_password'] ?? '';
    $new_pass     = $body['new_password']     ?? '';

    if (!$current_pass || !$new_pass) errorResponse('Mot de passe actuel et nouveau requis');
    if (strlen($new_pass) < 8)   errorResponse('Le nouveau mot de passe doit faire au moins 8 caractères');
    if (strlen($new_pass) > 128) errorResponse('Le mot de passe est trop long (128 caractères max)');
    if (!preg_match('/[A-Za-z]/', $new_pass) || !preg_match('/[0-9]/', $new_pass)) {
        errorResponse('Le nouveau mot de passe doit contenir au moins une lettre et un chiffre');
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($current_pass, $user['password_hash'])) {
        errorResponse('Mot de passe actuel incorrect', 401);
    }

    $hash = password_hash($new_pass, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $db->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$hash, $payload['user_id']]);
    jsonResponse(['success' => true, 'message' => 'Mot de passe mis à jour']);
}

// ─── PUT ?action=update-avatar ────────────────────────────────────────────────
if ($method === 'PUT' && $action === 'update-avatar') {
    $payload    = requireAuth();
    $body       = getBody();
    $avatar_url = validateOptionalUrl($body['avatar_url'] ?? null, 'avatar_url');

    // Limite la taille (data-URL base64 ou URL HTTP)
    if ($avatar_url !== null && strlen($avatar_url) > 2_000_000) {
        errorResponse('L\'avatar est trop volumineux (2 Mo max)');
    }

    $db   = getDB();
    $stmt = $db->prepare('UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$avatar_url, $payload['user_id']]);

    $stmt2 = $db->prepare('SELECT id, full_name, email, role, avatar_url, created_at FROM users WHERE id = ?');
    $stmt2->execute([$payload['user_id']]);
    $user = $stmt2->fetch();
    $user['id'] = (int)$user['id'];
    jsonResponse($user);
}

// ─── DELETE ?action=delete-account ───────────────────────────────────────────
if ($method === 'DELETE' && $action === 'delete-account') {
    $payload = requireAuth();
    $body    = getBody();
    $pass    = $body['password'] ?? '';

    if (!$pass) errorResponse('Mot de passe requis pour supprimer le compte');

    $db   = getDB();
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password_hash'])) {
        errorResponse('Mot de passe incorrect', 401);
    }

    // ON DELETE CASCADE supprime les transactions, budgets et objectifs liés
    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$payload['user_id']]);
    jsonResponse(['success' => true, 'message' => 'Compte supprimé']);
}

errorResponse('Action non trouvée', 404);
