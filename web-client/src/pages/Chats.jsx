import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data);
    };
    fetchChats();
  }, []);

  return (
    <div>
      <h1>Мої чати</h1>
      <Link to="/chats/new">Створити чат</Link>
      <ul>
        {chats.map(chat => (
          <li key={chat.id}>
            <Link to={`/chats/${chat.id}`}>
              {chat.name || `Чат #${chat.id}`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
