-- Migration : lier les transactions aux objectifs d'épargne
-- À exécuter une seule fois sur la base de données

ALTER TABLE transactions
  ADD COLUMN goal_id INT NULL DEFAULT NULL;

-- Index pour les recherches par objectif
CREATE INDEX idx_transactions_goal_id ON transactions (goal_id);
