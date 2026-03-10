import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const socketRef = useRef();
  const messagesEndRef = useRef();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    socketRef.current = io(socketUrl, {
      auth: { token }
    });

    socketRef.current.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('error', (err) => {
      console.error('Socket error:', err);
      alert(err);
    });

    socketRef.current.emit('join-chats', [chatId]);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();

    const fetchChatInfo = async () => {
      try {
        const res = await axios.get(`/api/chats/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatInfo(res.data);
      } catch (err) {
        navigate('/chats');
      }
    };
    fetchChatInfo();

    const fetchMembers = async () => {
      try {
        const res = await axios.get(`/api/chats/${chatId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMembers();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [chatId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current.emit('send-message', { chatId, content: input });
    setInput('');
  };

  return (
    <div className="flex h-screen bg-neon-dark">
      <div className="w-80 border-r border-neon-border flex flex-col">
        <div className="p-4 border-b border-neon-border">
          <button onClick={() => navigate('/chats')} className="text-neon-blue hover:text-white transition">
            ← До чатів
          </button>
        </div>
        <div className="p-4">
          <h2 className="font-semibold text-lg">{chatInfo?.name || `Чат #${chatId}`}</h2>
          <p className="text-sm text-neon-text-secondary">
            Учасники: {members.map(m => m.username).join(', ')}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-neon-border flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-neon-blue flex items-center justify-center text-white font-bold">
            {chatInfo?.name?.[0] || '#'}
          </div>
          <div>
            <h2 className="font-semibold">{chatInfo?.name || `Чат #${chatId}`}</h2>
            <p className="text-xs text-neon-text-secondary">Онлайн</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => {
            const isMine = msg.userId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs ${isMine ? 'chat-bubble-out' : 'chat-bubble-in'}`}>
                  {!isMine && <p className="text-xs text-neon-blue mb-1">{msg.username}</p>}
                  <p className="break-words">{msg.content}</p>
                  <p className="text-xs text-right text-neon-text-secondary mt-1">
                    {format(new Date(msg.createdAt), 'HH:mm', { locale: uk })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-neon-border flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишіть повідомлення..."
            className="input-primary flex-1"
          />
          <button type="submit" className="bg-neon-blue hover:bg-blue-600 text-white p-3 rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
