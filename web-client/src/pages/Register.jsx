import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }
    try {
      const res = await axios.post('/api/auth/register', { username, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/chats');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка реєстрації');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neon-dark">
      <div className="bg-neon-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-neon-border">
        <h2 className="text-3xl font-bold text-center mb-8 text-neon-blue">Створити акаунт</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Ім'я користувача"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-primary"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-primary"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Підтвердьте пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-primary"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="btn-primary">
            Зареєструватись
          </button>
        </form>
        <p className="mt-6 text-center text-neon-text-secondary">
          Вже є акаунт?{' '}
          <Link to="/login" className="text-neon-blue hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
