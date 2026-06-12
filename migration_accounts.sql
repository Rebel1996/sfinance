-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Migration : Gestion multi-compte (Option B)                    ║
-- ║  À exécuter UNE SEULE FOIS dans phpMyAdmin                      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Étape 1 : colonne account_id dans transactions (nullable, non-destructif)
ALTER TABLE transactions ADD COLUMN account_id INT NULL DEFAULT NULL;

-- Étape 2 : index pour les recherches par compte
CREATE INDEX idx_transactions_account_id ON transactions (account_id);

-- Étape 3 : créer un "Compte principal" pour chaque utilisateur
--           qui possède des transactions mais aucun compte
INSERT INTO accounts (user_id, name, type, icon, color, initial_balance)
SELECT DISTINCT t.user_id, 'Compte principal', 'courant', '🏦', 'primary', 0
FROM transactions t
WHERE NOT EXISTS (
    SELECT 1 FROM accounts a WHERE a.user_id = t.user_id
);

-- Étape 4 : rattacher toutes les transactions existantes (account_id NULL)
--           au premier compte de chaque utilisateur
UPDATE transactions t
INNER JOIN (
    SELECT user_id, MIN(id) AS account_id
    FROM accounts
    GROUP BY user_id
) a ON a.user_id = t.user_id
SET t.account_id = a.account_id
WHERE t.account_id IS NULL;
