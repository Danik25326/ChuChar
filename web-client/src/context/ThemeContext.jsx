import React, { createContext, useState, useContext, useEffect } from 'react';

const themes = {
  dark: {
    name: 'Темна',
    bg: 'bg-gray-900',
    text: 'text-white',
    primary: 'text-neon-blue',
    card: 'bg-gray-800',
    border: 'border-gray-700',
    bubbleOut: 'bg-neon-blue text-white',
    bubbleIn: 'bg-gray-700 text-white',
    gradient: 'from-gray-900 to-gray-800',
    button: 'bg-neon-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition',
    neonText: '',
    neonBorder: ''
  },
  light: {
    name: 'Світла',
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    primary: 'text-blue-600',
    card: 'bg-white',
    border: 'border-gray-300',
    bubbleOut: 'bg-blue-500 text-white',
    bubbleIn: 'bg-gray-200 text-gray-900',
    gradient: 'from-gray-100 to-white',
    button: 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition',
    neonText: '',
    neonBorder: ''
  },
  cyberpunk: {
    name: 'Кіберпанк',
    bg: 'bg-black',
    text: 'text-cyan-400',
    primary: 'text-fuchsia-500',
    card: 'bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-cyan-500',
    border: 'border-purple-700',
    bubbleOut: 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.5)]',
    bubbleIn: 'bg-gray-800 border border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(255,0,255,0.3)]',
    gradient: 'from-black via-purple-900 to-cyan-900',
    button: 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-700 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded shadow-[0_0_15px_rgba(255,0,255,0.5)] transition-all duration-300 transform hover:scale-105',
    neonText: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]',
    neonBorder: 'border-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.5)]',
    neonGlow: 'animate-pulse'
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? JSON.parse(saved) : themes.cyberpunk;
  });

  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(theme));
    // Застосовуємо класи до body
    document.body.className = `${theme.bg} ${theme.text}`;
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, themes, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
