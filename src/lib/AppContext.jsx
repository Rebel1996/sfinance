import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const THEMES = [
  { id: 'default', label: 'Émeraude', primary: '160 84% 39%', ring: '160 84% 39%', accent: '220 60% 50%' },
  { id: 'ocean',   label: 'Océan',    primary: '217 91% 60%', ring: '217 91% 60%', accent: '199 89% 48%' },
  { id: 'violet',  label: 'Violet',   primary: '263 70% 58%', ring: '263 70% 58%', accent: '280 65% 60%' },
  { id: 'sunset',  label: 'Coucher',  primary: '25 95% 53%',  ring: '25 95% 53%',  accent: '43 96% 56%' },
  { id: 'rose',    label: 'Rose',     primary: '347 77% 50%', ring: '347 77% 50%', accent: '330 60% 50%' },
  { id: 'slate',   label: 'Ardoise',  primary: '215 25% 40%', ring: '215 25% 40%', accent: '215 16% 47%' },
];

export const CURRENCIES = [
  { code: 'EUR', symbol: '€',   label: 'Euro',             flag: '🇪🇺' },
  { code: 'USD', symbol: '$',   label: 'Dollar US',        flag: '🇺🇸' },
  { code: 'GBP', symbol: '£',   label: 'Livre Sterling',   flag: '🇬🇧' },
  { code: 'CHF', symbol: 'Fr',  label: 'Franc Suisse',     flag: '🇨🇭' },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien',  flag: '🇨🇦' },
  { code: 'MAD', symbol: 'DH',  label: 'Dirham Marocain',  flag: '🇲🇦' },
  { code: 'MGA', symbol: 'Ar',  label: 'Ariary Malagasy',  flag: '🇲🇬' },
];

const AppContext = createContext(null);

function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--ring', theme.ring);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--chart-1', theme.primary);
  root.style.setProperty('--sidebar-primary', theme.primary);
  root.style.setProperty('--sidebar-ring', theme.ring);
}

export function AppProvider({ children }) {
  const [themeId, setThemeIdState] = useState(() => localStorage.getItem('ft_theme') || 'default');
  const [currencyCode, setCurrencyCodeState] = useState(() => localStorage.getItem('ft_currency') || 'EUR');
  const [darkMode, setDarkModeState] = useState(() => {
    const stored = localStorage.getItem('ft_dark');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => { applyTheme(themeId); }, [themeId]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const setThemeId = useCallback((id) => {
    setThemeIdState(id);
    localStorage.setItem('ft_theme', id);
  }, []);

  const setCurrencyCode = useCallback((code) => {
    setCurrencyCodeState(code);
    localStorage.setItem('ft_currency', code);
  }, []);

  const setDarkMode = useCallback((val) => {
    setDarkModeState(val);
    localStorage.setItem('ft_dark', String(val));
  }, []);

  const formatCurrency = useCallback((amount) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    const num = Number(amount) || 0;
    // MGA n'est pas supporté par Intl sur tous les navigateurs — fallback manuel
    if (currency.code === 'MGA') {
      return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(num))} Ar`;
    }
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return `${num.toFixed(2)} ${currency.symbol}`;
    }
  }, [currencyCode]);

  return (
    <AppContext.Provider value={{
      themeId, setThemeId,
      currencyCode, setCurrencyCode,
      darkMode, setDarkMode,
      formatCurrency,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
