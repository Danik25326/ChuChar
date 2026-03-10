import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Завантажимо останнє повідомлення для кожного чату (можна оптимізувати)
      const chatsWithLastMsg = await Promise.all(res.data.map(async (chat) => {
        try {
          const msgRes = await axios.get(`/api/chats/${chat.id}/messages?limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const lastMsg = msgRes.data[msgRes.data.length - 1];
          return { ...chat, lastMessage: lastMsg };
        } catch {
          return { ...chat, lastMessage: null };
        }
      }));
      setChats(chatsWithLastMsg);
    } catch (err) {
      console.error(err);
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
      // Виключаємо себе з результатів
      const filtered = res.data.filter(u => u.id !== user?.id);
      setSearchResults(filtered);
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
      // Оновити список чатів і перейти в новий чат (або просто оновити)
      fetchChats();
      // Можна відразу перейти
      window.location.href = `/chats/${res.data.chatId}`; // або використати navigate
    } catch (err) {
      alert('Помилка створення чату');
    }
  };

  return (
    <div className="flex h-screen bg-neon-dark">
      <div className="w-80 border-r border-neon-border flex flex-col">
        <div className="p-4 border-b border-neon-border flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neon-blue">ChuChar</h1>
          <button
            onClick={() => setShowModal(true)}
            className="text-neon-blue hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <Link
              key={chat.id}
              to={`/chats/${chat.id}`}
              className="block p-4 hover:bg-neon-hover transition border-b border-neon-border"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-neon-blue flex items-center justify-center text-white font-bold text-lg">
                  {chat.name ? chat.name[0].toUpperCase() : '#'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold truncate">{chat.name || `Чат #${chat.id}`}</h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-neon-text-secondary">
                        {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true, locale: uk })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neon-text-secondary truncate">
                    {chat.lastMessage ? (
                      <>
                        <span className="text-neon-text-primary">{chat.lastMessage.username}:</span> {chat.lastMessage.content}
                      </>
                    ) : (
                      'Немає повідомлень'
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-neon-border flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neon-hover flex items-center justify-center text-neon-blue font-bold">
            {user?.username?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.username}</p>
            <p className="text-xs text-neon-text-secondary">Онлайн</p>
          </div>
        </div>
      </div>

      {/* Модальне вікно створення чату */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-neon-card p-6 rounded-lg w-96 border border-neon-border">
            <h2 className="text-xl font-bold mb-4 text-neon-blue">Новий чат</h2>
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
                  className={`p-2 cursor-pointer rounded ${selectedUser?.id === u.id ? 'bg-neon-blue text-white' : 'hover:bg-neon-hover'}`}
                >
                  {u.username}
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-neon-hover rounded">Скасувати</button>
              <button onClick={createChat} disabled={!selectedUser} className="px-4 py-2 bg-neon-blue rounded disabled:opacity-50">
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
