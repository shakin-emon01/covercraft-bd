import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'covercraft-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return false;

  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark') return true;
  if (saved === 'light') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useThemeMode = () => {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  return {
    isDark,
    toggleTheme: () => setIsDark((prev) => !prev),
  };
};
