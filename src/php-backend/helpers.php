<?php
require_once __DIR__ . '/config.php';

// ─── Connexion PDO ───────────────────────────────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

// ─── Réponses JSON ───────────────────────────────────────────────────────────
function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse(string $message, int $status = 400): void {
    jsonResponse(['error' => $message], $status);
}

// ─── Body JSON ───────────────────────────────────────────────────────────────
function getBody(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('Corps de requête JSON invalide');
    }
    return $data ?? [];
}

// ─── Validation & sanitisation ────────────────────────────────────────────────

/**
 * Nettoie une chaîne : supprime les tags HTML, les espaces en trop, tronque à $maxLen.
 */
function sanitizeStr(string $value, int $maxLen = 255): string {
    return mb_substr(strip_tags(trim($value)), 0, $maxLen);
}

/**
 * Vérifie qu'une valeur appartient à une liste autorisée. Renvoie une erreur 400 sinon.
 */
function validateEnum(mixed $value, array $allowed, string $field): void {
    if (!in_array($value, $allowed, true)) {
        errorResponse("Valeur invalide pour « $field ». Valeurs autorisées : " . implode(', ', $allowed));
    }
}

/**
 * Valide une catégorie : accepte les catégories prédéfinies ET les catégories
 * personnalisées de l'utilisateur stockées dans user_categories.
 */
function validateCategoryForUser(PDO $db, int $userId, string $category): void {
    if (in_array($category, ALLOWED_CATEGORIES, true)) return;
    $stmt = $db->prepare('SELECT id FROM user_categories WHERE user_id = ? AND value = ?');
    $stmt->execute([$userId, $category]);
    if (!$stmt->fetch()) {
        errorResponse("Catégorie invalide ou non autorisée pour « category »");
    }
}

/**
 * Vérifie le format YYYY-MM-DD et que la date est réelle.
 */
function validateDate(string $value, string $field = 'date'): void {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        errorResponse("Format de date invalide pour « $field » (attendu : YYYY-MM-DD)");
    }
    [$y, $m, $d] = explode('-', $value);
    if (!checkdate((int)$m, (int)$d, (int)$y)) {
        errorResponse("Date invalide pour « $field »");
    }
    // Refus des dates absurdes (< 1900 ou > 2200)
    $year = (int)$y;
    if ($year < 1900 || $year > 2200) {
        errorResponse("Année hors limites pour « $field »");
    }
}

/**
 * Valide et retourne un montant positif dans des bornes raisonnables.
 */
function validateAmount(mixed $value, string $field = 'amount', float $min = 0.01, float $max = 99_999_999.99): float {
    if (!is_numeric($value)) {
        errorResponse("Le montant « $field » doit être un nombre");
    }
    $amount = round((float)$value, 2);
    if ($amount < $min || $amount > $max) {
        errorResponse("Le montant « $field » doit être compris entre $min et $max");
    }
    return $amount;
}

/**
 * Valide une URL (optionnelle). Accepte null/vide.
 */
function validateOptionalUrl(mixed $value, string $field): ?string {
    if ($value === null || $value === '') return null;
    $url = filter_var(trim((string)$value), FILTER_VALIDATE_URL);
    if ($url === false) {
        errorResponse("URL invalide pour « $field »");
    }
    return $url;
}

// ─── JWT — Access token (courte durée) & Refresh token (longue durée) ────────
function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

/**
 * Génère un access token (type='access', durée JWT_ACCESS_EXPIRY).
 */
function generateAccessJWT(array $payload): string {
    return _buildJWT(array_merge($payload, ['type' => 'access']), JWT_ACCESS_EXPIRY);
}

/**
 * Génère un refresh token (type='refresh', durée JWT_REFRESH_EXPIRY).
 * Ne contient que user_id pour minimiser les données exposées.
 */
function generateRefreshJWT(int $userId): string {
    return _buildJWT(['user_id' => $userId, 'type' => 'refresh'], JWT_REFRESH_EXPIRY);
}

function _buildJWT(array $payload, int $expiry): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + $expiry;
    $payload['iat'] = time();
    $p   = base64url_encode(json_encode($payload));
    $sig = base64url_encode(hash_hmac('sha256', "$header.$p", JWT_SECRET, true));
    return "$header.$p.$sig";
}

/**
 * Vérifie la signature et l'expiration. Retourne le payload ou null.
 * $expectedType : 'access' | 'refresh' | null (pas de vérification de type)
 */
function verifyJWT(string $token, ?string $expectedType = null): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $payload, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $data = json_decode(base64url_decode($payload), true);
    if (!$data || ($data['exp'] ?? 0) < time()) return null;
    if ($expectedType !== null && ($data['type'] ?? '') !== $expectedType) return null;
    return $data;
}

// ─── Récupération du header Authorization ────────────────────────────────────
// Certains hébergeurs (InfinityFree, rf.gd...) suppriment HTTP_AUTHORIZATION.
function getAuthorizationHeader(): string {
    if (!empty($_SERVER['HTTP_AUTHORIZATION']))          return $_SERVER['HTTP_AUTHORIZATION'];
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (!empty($headers['Authorization']))  return $headers['Authorization'];
        if (!empty($headers['authorization']))  return $headers['authorization'];
    }
    return '';
}

// ─── Authentification middleware ─────────────────────────────────────────────
function requireAuth(): array {
    $authHeader = getAuthorizationHeader();
    if (!str_starts_with($authHeader, 'Bearer ')) {
        errorResponse('Non authentifié', 401);
    }
    $token = substr($authHeader, 7);
    $payload = verifyJWT($token, 'access');
    if (!$payload) {
        errorResponse('Token invalide ou expiré', 401);
    }
    return $payload;
}

// ─── CORS ────────────────────────────────────────────────────────────────────
function setCORSHeaders(): void {
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
