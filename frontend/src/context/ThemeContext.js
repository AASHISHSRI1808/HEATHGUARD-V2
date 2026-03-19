import React, { createContext, useContext, useState, useEffect } from 'react';
const Ctx = createContext(null);
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('hg_theme') || 'light');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('hg_theme', theme); }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  return <Ctx.Provider value={{ theme, toggleTheme, dark: theme === 'dark' }}>{children}</Ctx.Provider>;
};
export const useTheme = () => useContext(Ctx);
