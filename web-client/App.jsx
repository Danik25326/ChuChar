import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import { AuthContext } from './context/AuthContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // TODO: перевірити токен на бекенді
      setUser({ token }); // тимчасово
    }
    setLoading(false);
  }, []);

  if (loading) return <div>Завантаження...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/chats" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/chats" />} />
          <Route path="/chats" element={user ? <Chats /> : <Navigate to="/login" />} />
          <Route path="/chats/:chatId" element={user ? <Chat /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/chats" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
