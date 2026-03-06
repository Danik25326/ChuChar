# ChuChar Backend

## Встановлення
1. `npm install`
2. Скопіюй `.env.example` в `.env` та заповни змінні
3. `npm run dev` — запуск в режимі розробки

## API endpoints
- `POST /api/auth/register` — реєстрація
- `POST /api/auth/login` — вхід
- `GET /api/users/:id` — отримати користувача
- `POST /api/chats` — створити чат
- `GET /api/chats` — список чатів
- WebSocket — події чату (див. документацію)
