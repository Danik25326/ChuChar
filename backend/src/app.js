import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import { AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neon-dark">
        <div className="text-neon-blue text-xl">Завантаження...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, setUser }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/chats" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/chats" />} />
            <Route path="/chats" element={user ? <Chats /> : <Navigate to="/login" />} />
            <Route path="/chats/:chatId" element={user ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/chats" />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
