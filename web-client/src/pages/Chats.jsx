import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar  from '../%20components/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const { theme, themes, changeTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await axios.get('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data || !Array.isArray(res.data)) {
        setChats([]);
        setLoading(false);
        return;
      }

      // Отримуємо деталі користувачів для особистих чатів
      const chatsWithDetails = await Promise.all(res.data.map(async (chat) => {
        // Отримуємо останнє повідомлення
        try {
          const msgRes = await axios.get(`/api/chats/${chat.id}/messages?limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const lastMsg = msgRes.data && msgRes.data.length > 0 ? msgRes.data[msgRes.data.length - 1] : null;
          
          // Для особистого чату визначаємо співрозмовника
          let otherUser = null;
          if (!chat.is_group && chat.other_usernames) {
            // Тут потрібно було б отримати повну інформацію про іншого користувача, але для простоти залишимо так
            // Можна зробити окремий запит
          }
          return { ...chat, lastMessage: lastMsg };
        } catch {
          return { ...chat, lastMessage: null };
        }
      }));
      
      setChats(chatsWithDetails);
    } catch (err) {
      console.error('Помилка завантаження чатів:', err);
      setError('Не вдалося завантажити чати. Спробуйте пізніше.');
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createChat = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('/api/chats', {
        isGroup: false,
        memberIds: [selectedUser.id]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      navigate(`/chats/${res.data.chatId}`);
    } catch (err) {
      alert('Помилка створення чату');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return formatDistanceToNow(date, { addSuffix: true, locale: uk });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme.bg}`}>
        <div className="text-neon-blue text-xl">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme.bg}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-neon-blue px-4 py-2 rounded text-white"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text}`}>
      <div className={`w-80 border-r ${theme.border} flex flex-col`}>
        <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
          <h1 className={`text-2xl font-bold ${theme.primary}`}>ChuChar</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/profile')}
              className="text-neon-blue hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="text-neon-blue hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-neon-text-secondary">
              У вас ще немає чатів. Натисніть "+", щоб створити новий.
            </div>
          ) : (
            chats.map(chat => (
              <Link
                key={chat.id}
                to={`/chats/${chat.id}`}
                className={`block p-4 hover:bg-opacity-10 transition border-b ${theme.border}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center space-x-3">
                  <Avatar user={chat.otherUser} size="w-12 h-12" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold truncate">
                        {chat.displayName}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-neon-text-secondary">
                          {formatDate(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neon-text-secondary truncate">
                      {chat.lastMessage ? (
                        <>
                          <span className={theme.primary}>{chat.lastMessage.username}:</span> {chat.lastMessage.content}
                        </>
                      ) : (
                        'Немає повідомлень'
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className={`p-4 border-t ${theme.border} flex items-center space-x-3`}>
          <Avatar user={user} size="w-10 h-10" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.username}</p>
            <p className="text-xs text-neon-text-secondary">Онлайн</p>
          </div>
        </div>
      </div>

      {/* Модальне вікно створення чату */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme.card} p-6 rounded-lg w-96 border ${theme.border}`}>
            <h2 className={`text-xl font-bold mb-4 ${theme.primary}`}>Новий чат</h2>
            <input
              type="text"
              placeholder="Пошук користувачів..."
              value={searchQuery}
              onChange={handleSearch}
              className="input-primary mb-2"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto mb-4">
              {searchResults.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-2 cursor-pointer rounded flex items-center space-x-2 ${
                    selectedUser?.id === u.id 
                      ? 'bg-neon-blue text-white' 
                      : 'hover:bg-opacity-10'
                  }`}
                >
                  <Avatar user={u} size="w-8 h-8" />
                  <span>{u.username}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setSearchQuery('');
                }} 
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Скасувати
              </button>
              <button 
                onClick={createChat} 
                disabled={!selectedUser} 
                className="px-4 py-2 bg-neon-blue rounded disabled:opacity-50"
              >
                Створити
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center text-neon-text-secondary">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Оберіть чат</h2>
          <p>Почніть спілкування з друзями</p>
        </div>
      </div>
    </div>
  );
}
