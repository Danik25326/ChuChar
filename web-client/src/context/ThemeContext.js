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
    gradient: 'from-gray-900 to-gray-800'
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
    gradient: 'from-gray-100 to-white'
  },
  cyberpunk: {
    name: 'Кіберпанк',
    bg: 'bg-black',
    text: 'text-cyan-400',
    primary: 'text-purple-500',
    card: 'bg-gray-900',
    border: 'border-purple-700',
    bubbleOut: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
    bubbleIn: 'bg-gray-800 border border-cyan-500 text-cyan-300',
    gradient: 'from-black via-purple-900 to-black'
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
    document.body.className = theme.bg + ' ' + theme.text;
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={ theme, themes, changeTheme }>
      {children}
    <ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
