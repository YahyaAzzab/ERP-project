import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'erp-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
