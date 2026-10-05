import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../lib/constants';

const ThemeContext = createContext(null);

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored) return stored;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark ? THEMES.DARK : THEMES.LIGHT;
    } catch {
      return THEMES.LIGHT;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === THEMES.DARK) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  }, []);

  const setLightTheme = useCallback(() => setTheme(THEMES.LIGHT), []);
  const setDarkTheme = useCallback(() => setTheme(THEMES.DARK), []);

  const value = {
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    toggleTheme,
    setTheme: setTheme,
    setLightTheme,
    setDarkTheme,
    THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { THEMES };
