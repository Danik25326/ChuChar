import { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:3000', {
      auth: { token }
    });

    socketRef.current.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.emit('join-chats', [chatId]);

    // Завантажити попередні повідомлення
    const fetchMessages = async () => {
      const res = await axios.get(`/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    };
    fetchMessages();

    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current.emit('send-message', { chatId, content: input });
    setInput('');
  };

  return (
    <div>
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: '8px' }}>
            <strong>{msg.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишіть повідомлення..."
        />
        <button type="submit">Відправити</button>
      </form>
    </div>
  );
}
