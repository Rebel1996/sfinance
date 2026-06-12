-- Migration : table des catégories personnalisées par utilisateur
-- Version sans FOREIGN KEY (compatible InfinityFree / hébergements mutualisés)
-- À exécuter UNE SEULE FOIS sur votre base MySQL via phpMyAdmin

CREATE TABLE IF NOT EXISTS user_categories (
    id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    type       ENUM('revenu','depense') NOT NULL,
    value      VARCHAR(120) NOT NULL,
    label      VARCHAR(100) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_cat_value (user_id, value),
    UNIQUE KEY uq_user_cat_label (user_id, type, label),
    INDEX      idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
