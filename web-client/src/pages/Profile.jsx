import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from '../components/Avatar';

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const { theme, themes, changeTheme } = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', selectedFile);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/users/avatar', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser({ ...user, avatar: res.data.avatar });
      setSelectedFile(null);
    } catch (err) {
      alert('Помилка завантаження аватарки');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-8`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate('/chats')} className={theme.primary}>
          ← Назад до чатів
        </button>
        <div className={`mt-8 ${theme.card} p-6 rounded-lg border ${theme.border}`}>
          <h2 className={`text-2xl font-bold ${theme.primary} mb-6`}>Профіль</h2>
          
          <div className="flex flex-col items-center mb-6">
            <Avatar user={user} size="w-24 h-24" />
            <p className="mt-2 text-xl">{user?.username}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Змінити аватарку</h3>
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*"
              className="mb-2"
            />
            {selectedFile && (
              <button
                onClick={uploadAvatar}
                disabled={uploading}
                className="bg-neon-blue px-4 py-2 rounded text-white disabled:opacity-50"
              >
                {uploading ? 'Завантаження...' : 'Завантажити'}
              </button>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Виберіть тему</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(themes).map(key => (
                <button
                  key={key}
                  onClick={() => changeTheme(themes[key])}
                  className={`p-2 rounded border ${theme.border} ${theme.card} ${
                    theme.name === themes[key].name ? 'ring-2 ring-neon-blue' : ''
                  }`}
                >
                  {themes[key].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
