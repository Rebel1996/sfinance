<?php
// FinTrack - Configuration
// Modifiez ces valeurs selon votre environnement

define('DB_HOST',    'localhost');
define('DB_NAME',    'fintrack');
define('DB_USER',    'root');        // Votre utilisateur MySQL
define('DB_PASS',    '');            // Votre mot de passe MySQL
define('DB_CHARSET', 'utf8mb4');

define('JWT_SECRET',          'CHANGEZ_CE_SECRET_TRES_LONG_ET_ALEATOIRE_ICI'); // Changez ceci !
define('JWT_ACCESS_EXPIRY',   60 * 60);           // Access token  : 1 heure
define('JWT_REFRESH_EXPIRY',  60 * 60 * 24 * 30); // Refresh token : 30 jours

// Origines autorisées pour CORS (votre domaine frontend)
define('ALLOWED_ORIGIN', '*'); // Remplacez par votre domaine en production ex: 'https://monsite.com'

// ─── Listes de valeurs autorisées (synchronisées avec categories.js) ─────────
define('ALLOWED_TX_TYPES',       ['revenu', 'depense']);
define('ALLOWED_CATEGORIES',     [
    'salaire', 'freelance', 'investissement', 'vente',
    'logement', 'loyer', 'courses', 'alimentation', 'restaurant_bar',
    'transport', 'loisirs', 'sante', 'education', 'services',
    'impots', 'epargne', 'dettes', 'autre',
]);
define('ALLOWED_RECURRENCES',    ['quotidien', 'hebdomadaire', 'mensuel', 'annuel']);
define('ALLOWED_BUDGET_PERIODS', ['mensuel', 'annuel']);
define('ALLOWED_GOAL_STATUSES',  ['en_cours', 'atteint', 'abandonne']);
