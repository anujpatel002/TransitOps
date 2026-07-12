import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';
interface ThemeCtx { theme: Theme; toggle: () => void; }

const ThemeContext = createContext<ThemeCtx>(null!);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) ?? 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
