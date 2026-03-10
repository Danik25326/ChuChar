import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('/api/chats', {
          headers: { Authorization: `Bearer ${token}` }
        });
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
    fetchChats();
  }, []);

  const handleNewChat = () => {
    alert('Функція створення чату скоро з\'явиться!');
  };

  return (
    <div className="flex h-screen bg-neon-dark">
      <div className="w-80 border-r border-neon-border flex flex-col">
        <div className="p-4 border-b border-neon-border flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neon-blue">ChuChar</h1>
          <button
            onClick={handleNewChat}
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

      <div className="flex-1 flex items-center justify-center text-neon-text-secondary">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Оберіть чат</h2>
          <p>Почніть спілкування з друзями</p>
        </div>
      </div>
    </div>
  );
}
