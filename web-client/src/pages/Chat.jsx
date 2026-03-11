import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import AudioPlayer  from '../components/AudioPlayer';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const socketRef = useRef();
  const messagesEndRef = useRef();
  const messagesContainerRef = useRef();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const formatTimeSafe = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return format(date, 'HH:mm', { locale: uk });
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    socketRef.current = io(socketUrl, {
      auth: { token }
    });

    socketRef.current.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err);
    });

    socketRef.current.emit('join-chats', [chatId]);

    const fetchChatInfo = async () => {
      try {
        const res = await axios.get(`/api/chats/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatInfo(res.data);
      } catch (err) {
        console.error(err);
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

  const fetchMessages = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const currentPage = reset ? 1 : page;
      const res = await axios.get(`/api/chats/${chatId}/messages?page=${currentPage}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newMessages = res.data;
      if (reset) {
        setMessages(newMessages);
        setPage(2);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setPage(prev => prev + 1);
      }
      setHasMore(newMessages.length === 20);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (messagesContainerRef.current.scrollTop === 0 && hasMore && !loading) {
      fetchMessages();
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current.emit('send-message', { chatId, type: 'text', content: input });
    setInput('');
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      let fileType = 'file';
      if (selectedFile.type.startsWith('image/')) fileType = 'image';
      else if (selectedFile.type.startsWith('video/')) fileType = 'video';
      else if (selectedFile.type.startsWith('audio/')) fileType = 'audio';

      socketRef.current.emit('send-message', {
        chatId,
        type: fileType,
        content: res.data.url,
        original_filename: res.data.original_filename,
        mime: res.data.mimetype
      });

      setSelectedFile(null);
      fileInputRef.current.value = '';
    } catch (err) {
      alert('Помилка завантаження файлу');
      console.error(err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        await uploadFile();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Не вдалося отримати доступ до мікрофона');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getFileIcon = (msg) => {
    if (msg.type === 'audio') return '🎤';
    if (msg.mime?.startsWith('image/')) return '🖼️';
    if (msg.mime?.startsWith('video/')) return '🎥';
    if (msg.mime?.includes('pdf')) return '📄';
    if (msg.mime?.includes('word') || msg.mime?.includes('document')) return '📝';
    if (msg.mime?.includes('excel') || msg.mime?.includes('sheet')) return '📊';
    if (msg.mime?.includes('presentation') || msg.mime?.includes('powerpoint')) return '📽️';
    return '📎';
  };

  const renderMessage = (msg) => {
    const safeMsg = {
      ...msg,
      original_filename: msg.original_filename || 'Файл',
      mime: msg.mime || '',
      content: msg.content || '',
      type: msg.type || 'text',
      username: msg.username || 'Користувач',
      createdAt: msg.createdAt || null
    };

    const isMine = safeMsg.userId === user?.id;
    return (
      <div key={safeMsg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs ${isMine ? theme.bubbleOut : theme.bubbleIn} p-2 rounded-lg`}>
          {!isMine && <p className={`text-xs ${theme.primary} mb-1`}>{safeMsg.username}</p>}
          
          {safeMsg.type === 'text' && <p className="break-words">{safeMsg.content}</p>}
          
          {safeMsg.type === 'image' && safeMsg.content && (
            <img 
              src={`${apiUrl}${safeMsg.content}`} 
              alt="Зображення" 
              className="max-w-full rounded cursor-pointer"
              onClick={() => window.open(`${apiUrl}${safeMsg.content}`, '_blank')}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=Помилка+завантаження';
              }}
            />
          )}
          
          {safeMsg.type === 'video' && safeMsg.content && (
            <video controls className="max-w-full rounded">
              <source src={`${apiUrl}${safeMsg.content}`} />
            </video>
          )}
          
          {safeMsg.type === 'audio' && safeMsg.content && (
            <AudioPlayer src={`${apiUrl}${safeMsg.content}`} />
          )}
          
          {(safeMsg.type === 'file' || (safeMsg.type !== 'text' && safeMsg.type !== 'image' && safeMsg.type !== 'video' && safeMsg.type !== 'audio')) && safeMsg.content && (
            <a 
              href={`${apiUrl}${safeMsg.content}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-2 bg-neon-card rounded hover:bg-opacity-10 transition"
            >
              <span className="text-2xl">{getFileIcon(safeMsg)}</span>
              <span className="truncate">{safeMsg.original_filename}</span>
            </a>
          )}
          
          <p className="text-xs text-right text-neon-text-secondary mt-1">
            {formatTimeSafe(safeMsg.createdAt)}
          </p>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme.bg}`}>
        <div className="text-center text-red-500">
          <p>Сталася помилка: {error}</p>
          <button 
            onClick={() => navigate('/chats')}
            className="mt-4 px-4 py-2 bg-neon-blue rounded text-white"
          >
            Повернутися до чатів
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text}`}>
      <div className={`w-80 border-r ${theme.border} flex flex-col`}>
        <div className={`p-4 border-b ${theme.border}`}>
          <button onClick={() => navigate('/chats')} className={theme.primary}>
            ← До чатів
          </button>
        </div>
        <div className="p-4">
          <h2 className="font-semibold text-lg">{chatInfo?.displayName || `Чат #${chatId}`}</h2>
          <p className="text-sm text-neon-text-secondary">
            Учасники: {members.map(m => m.username).join(', ')}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className={`p-4 border-b ${theme.border} flex items-center space-x-3`}>
          <Avatar user={chatInfo?.otherUser} size="w-10 h-10" />
          <div>
            <h2 className="font-semibold">{chatInfo?.displayName || `Чат #${chatId}`}</h2>
            <p className="text-xs text-neon-text-secondary">Онлайн</p>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {loading && <div className="text-center text-neon-text-secondary">Завантаження...</div>}
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        <div className={`p-4 border-t ${theme.border}`}>
          {selectedFile && (
            <div className={`mb-2 flex items-center justify-between ${theme.card} p-2 rounded`}>
              <span className="text-sm truncate">{selectedFile.name}</span>
              <button
                onClick={uploadFile}
                className="bg-neon-blue text-white px-3 py-1 rounded text-sm"
              >
                Завантажити
              </button>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишіть повідомлення..."
              className={`input-primary flex-1 ${theme.card} ${theme.text}`}
            />
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`${theme.card} hover:bg-opacity-10 p-3 rounded-lg transition cursor-pointer`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </label>

            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition relative"
              >
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                  {formatTime(recordingTime)}
                </span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className={`${theme.card} hover:bg-opacity-10 p-3 rounded-lg transition`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.915A7.002 7.002 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.002 7.002 0 006 6.915V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.085z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            <button type="submit" className="bg-neon-blue hover:bg-blue-600 text-white p-3 rounded-lg transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
