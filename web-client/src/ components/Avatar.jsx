import React from 'react';

export default function Avatar({ user, size = 'w-10 h-10', className = '' }) {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const initials = user?.username?.charAt(0).toUpperCase() || '?';
  const avatarUrl = user?.avatar;

  if (avatarUrl) {
    return (
      <img
        src={`${apiUrl}${avatarUrl}`}
        alt={user?.username || 'avatar'}
        className={`rounded-full object-cover ${size} ${className}`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${initials}&background=0D8FDB&color=fff&size=128`;
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white ${size} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {initials}
    </div>
  );
}
