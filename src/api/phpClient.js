// Client HTTP pour le backend PHP
// VITE_API_URL dans .env.local pour surcharger (développement local).
// Par défaut : URL relative au domaine courant → fonctionne automatiquement en production.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? window.location.origin + '/php-backend/api'
    : 'http://localhost/php-backend/api');

const ACCESS_TOKEN_KEY  = 'fintrack_access_token';
const REFRESH_TOKEN_KEY = 'fintrack_refresh_token';

function getToken()        { return localStorage.getItem(ACCESS_TOKEN_KEY); }
function getRefreshToken() { return localStorage.getItem(REFRESH_TOKEN_KEY); }

function saveTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── Gestion du refresh concurrent ───────────────────────────────────────────
// Évite plusieurs appels /refresh simultanés si plusieurs requêtes expirent en même temps.
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Aucun refresh token disponible');

  const res  = await fetch(`${API_BASE_URL}/auth.php?action=refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session expirée');

  saveTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

// ─── Requête HTTP principale ──────────────────────────────────────────────────
async function request(path, options = {}, _isRetry = false) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // Access token expiré → tentative de refresh
  if (res.status === 401 && !_isRetry) {
    if (isRefreshing) {
      // Mise en attente : une autre requête est déjà en train de rafraîchir
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(newToken => {
        const updated = {
          ...options,
          headers: {
            ...(options.headers || {}),
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
        };
        return request(path, updated, true);
      });
    }

    isRefreshing = true;
    try {
      const newToken = await tryRefresh();
      processQueue(null, newToken);
      // Rejouer la requête originale avec le nouvel access token
      return request(path, options, true);
    } catch (err) {
      processQueue(err);
      clearTokens();
      // Notifier l'application que la session a expiré
      window.dispatchEvent(new CustomEvent('fintrack:session-expired'));
      throw new Error('Session expirée, veuillez vous reconnecter');
    } finally {
      isRefreshing = false;
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur API');
  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    request('/auth.php?action=login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (full_name, email, password) =>
    request('/auth.php?action=register', { method: 'POST', body: JSON.stringify({ full_name, email, password }) }),

  me: () => request('/auth.php?action=me'),

  updateProfile: (data) =>
    request('/auth.php?action=update-profile', { method: 'PUT', body: JSON.stringify(data) }),

  updatePassword: (data) =>
    request('/auth.php?action=update-password', { method: 'PUT', body: JSON.stringify(data) }),

  updateAvatar: (avatar_url) =>
    request('/auth.php?action=update-avatar', { method: 'PUT', body: JSON.stringify({ avatar_url }) }),

  deleteAccount: (password) =>
    request('/auth.php?action=delete-account', { method: 'DELETE', body: JSON.stringify({ password }) }),

  // Sauvegarde les deux tokens après login/register
  saveTokens,
  // Rétrocompatibilité : si on passe un seul token (access)
  saveToken: (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token),

  logout: () => clearTokens(),
  getToken,
  isAuthenticated: () => !!getToken(),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions.php${qs ? '?' + qs : ''}`);
  },
  create: (data) => request('/transactions.php', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/transactions.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/transactions.php?id=${id}`, { method: 'DELETE' }),
};

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const budgetsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/budgets.php${qs ? '?' + qs : ''}`);
  },
  create: (data) => request('/budgets.php', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/budgets.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/budgets.php?id=${id}`, { method: 'DELETE' }),
};

// ─── Catégories personnalisées ────────────────────────────────────────────────
export const categoriesApi = {
  list: () => request('/categories.php'),
  create: (data) => request('/categories.php', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories.php?id=${id}`, { method: 'DELETE' }),
};

// ─── Comptes ──────────────────────────────────────────────────────────────────
export const accountsApi = {
  list: () => request('/accounts.php'),
  create: (data) => request('/accounts.php', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/accounts.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/accounts.php?id=${id}`, { method: 'DELETE' }),
  transfer: (data) => request('/accounts.php?action=transfer', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Objectifs d'épargne ──────────────────────────────────────────────────────
export const goalsApi = {
  list: () => request('/goals.php'),
  create: (data) => request('/goals.php', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/goals.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addAmount: (id, amount) =>
    request(`/goals.php?id=${id}`, { method: 'PUT', body: JSON.stringify({ add_amount: amount }) }),
  delete: (id) => request(`/goals.php?id=${id}`, { method: 'DELETE' }),
};
