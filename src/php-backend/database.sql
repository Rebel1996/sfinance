-- FinTrack - Structure de la base de données MySQL
-- Créez une base de données et exécutez ce fichier

CREATE DATABASE IF NOT EXISTS fintrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fintrack;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    avatar_url MEDIUMTEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('revenu', 'depense') NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    is_recurring TINYINT(1) NOT NULL DEFAULT 0,
    recurrence ENUM('quotidien', 'hebdomadaire', 'mensuel', 'annuel') NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des budgets
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    period ENUM('mensuel', 'annuel') DEFAULT 'mensuel',
    month TINYINT,
    year SMALLINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATIONS — à exécuter sur une base existante (ne ré-exécutez pas le CREATE)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ajouter avatar_url si la colonne manque :
--    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url MEDIUMTEXT NULL;

-- 2. Convertir la colonne category de ENUM → VARCHAR pour accepter toutes
--    les nouvelles catégories (logement, courses, restaurant_bar, dettes, …) :
--    ALTER TABLE transactions MODIFY COLUMN category VARCHAR(50) NOT NULL;
--    ALTER TABLE budgets      MODIFY COLUMN category VARCHAR(50) NOT NULL;

-- 3. Ajouter les colonnes de récurrence (transactions récurrentes) :
--    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring TINYINT(1) NOT NULL DEFAULT 0;
--    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurrence ENUM('quotidien','hebdomadaire','mensuel','annuel') NULL;
