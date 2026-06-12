import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Accounts from './pages/Accounts';
import Profile from './pages/Profile';
import { AppProvider } from '@/lib/AppContext';
import { UserProvider } from '@/lib/UserContext';
import PhpLogin from './components/PhpLogin';
import { authApi } from '@/api/phpClient';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authApi.isAuthenticated()) {
      authApi.me()
        .then(setUser)
        .catch(() => { authApi.logout(); setUser(null); })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  // Déconnexion automatique si le refresh token est expiré ou invalide
  useEffect(() => {
    const handleSessionExpired = () => {
      authApi.logout();
      setUser(null);
    };
    window.addEventListener('fintrack:session-expired', handleSessionExpired);
    return () => window.removeEventListener('fintrack:session-expired', handleSessionExpired);
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <AppProvider>
        <PhpLogin onLogin={setUser} />
        <Toaster />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <UserProvider initialUser={user} onLogout={handleLogout}>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/"             element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budgets"      element={<Budgets />} />
                <Route path="/goals"        element={<Goals />} />
                <Route path="/accounts"     element={<Accounts />} />
                <Route path="/profile"      element={<Profile />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </UserProvider>
    </AppProvider>
  );
}

export default App
