import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Avatar({ user, size = 'w-10 h-10', className = '' }) {
  const { theme } = useTheme();
  const initials = user?.username?.charAt(0).toUpperCase() || '?';
  const avatarUrl = user?.avatar;

  if (avatarUrl) {
    return (
      <img
        src={`${import.meta.env.VITE_API_URL}${avatarUrl}`}
        alt={user?.username}
        className={`rounded-full object-cover ${size} ${className}`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=random`;
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${size} ${className}`}
      style={{ background: theme.primary, color: 'white' }}
    >
      {initials}
    </div>
  );
}
