import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Chats from './pages/Chats';
import Chat from './pages/Chat';
import { AuthContext } from './context/AuthContext';
import axios from 'axios';

// Встановлюємо базовий URL для всіх axios-запитів
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Глобальний обробник помилок React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Помилка додатку:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neon-dark flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl text-red-500 mb-4">Щось пішло не так</h1>
            <p className="text-neon-text-secondary mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-neon-blue px-4 py-2 rounded text-white"
            >
              Перезавантажити
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
