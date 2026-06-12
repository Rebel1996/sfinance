# FinTrack — Backend PHP

Backend PHP/MySQL indépendant pour remplacer Base44.

## Structure des fichiers

```
php-backend/
├── config.php              # Configuration DB + JWT
├── helpers.php             # PDO, JWT, CORS, helpers
├── database.sql            # Script SQL (tables)
├── api/
│   ├── auth.php            # Register / Login / Me
│   ├── transactions.php    # CRUD transactions
│   └── budgets.php         # CRUD budgets
└── README.md
```

## Installation

### 1. Base de données
```sql
-- Dans phpMyAdmin ou MySQL CLI :
source /chemin/vers/database.sql
```

### 2. Configuration
Éditez `config.php` et renseignez vos identifiants MySQL et un JWT secret fort.

### 3. Upload sur le serveur
Uploadez le dossier `php-backend/` à la racine de votre serveur (ex: `/public_html/api/`).

### 4. Frontend React
Dans le frontend React, remplacez le client Base44 par un client HTTP pointant vers votre API.

---

## Endpoints API

### Auth
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/auth.php?action=register` | Créer un compte |
| POST | `/api/auth.php?action=login` | Se connecter |
| GET  | `/api/auth.php?action=me` | Profil utilisateur (auth requise) |

**Login — Body :**
```json
{ "email": "user@example.com", "password": "monmotdepasse" }
```
**Réponse :**
```json
{ "token": "eyJ...", "user": { "id": 1, "full_name": "...", "email": "..." } }
```

### Transactions (Authorization: Bearer TOKEN requis)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET    | `/api/transactions.php` | Lister (filtres: type, category, year, month, search) |
| GET    | `/api/transactions.php?id=X` | Détail |
| POST   | `/api/transactions.php` | Créer |
| PUT    | `/api/transactions.php?id=X` | Modifier |
| DELETE | `/api/transactions.php?id=X` | Supprimer |

### Budgets (Authorization: Bearer TOKEN requis)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET    | `/api/budgets.php` | Lister (filtres: year, period) |
| GET    | `/api/budgets.php?id=X` | Détail |
| POST   | `/api/budgets.php` | Créer |
| PUT    | `/api/budgets.php?id=X` | Modifier |
| DELETE | `/api/budgets.php?id=X` | Supprimer |

---

## Adapter le frontend React

Remplacez les appels Base44 dans le code React par des appels `fetch` vers votre API :

```js
// Avant (Base44)
const txs = await base44.entities.Transaction.list('-date', 500);

// Après (votre API PHP)
const token = localStorage.getItem('token');
const res = await fetch('/api/transactions.php', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const txs = await res.json();
```

```js
// Créer une transaction
const res = await fetch('/api/transactions.php', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ description, amount, type, category, date, notes })
});
``