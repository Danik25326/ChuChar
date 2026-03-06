# Архітектура ChuChar

ChuChar побудований на клієнт-серверній архітектурі з використанням WebSocket для реального часу.

## Компоненти
- **Backend** (Node.js + Express + Socket.io)
- **Web Client** (React + Vite)
- **Mobile Client** (React Native + Expo)

## Схема взаємодії
1. Клієнт автентифікується через REST API, отримує JWT.
2. Для чатів використовується WebSocket (з JWT в handshake).
3. Повідомлення зберігаються в SQLite (або PostgreSQL).
4. ШІ-помічник викликається через OpenAI API.
