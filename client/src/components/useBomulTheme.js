import { useState } from 'react';

const THEME_KEY = 'bomul-theme';

export function useBomulTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY));

  function toggleTheme() {
    const dark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    setTheme(next);
  }

  return { theme, toggleTheme };
}
