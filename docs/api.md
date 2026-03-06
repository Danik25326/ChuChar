# API ChuChar

Базовий URL: `http://localhost:3000/api`

## Аутентифікація
Більшість ендпоінтів потребують заголовок: `Authorization: Bearer <token>`

### Реєстрація
`POST /auth/register`
Body: `{ "username": "...", "password": "..." }`
Відповідь: `{ "token": "...", "user": { "id": 1, "username": "..." } }`

### Вхід
`POST /auth/login`
Body: `{ "username": "...", "password": "..." }`
Відповідь: така ж, як при реєстрації.

## Користувачі
### Отримати користувача
`GET /users/:id`

## Чати
### Створити чат
`POST /chats`
Body: `{ "name": "Назва", "isGroup": true, "memberIds": [2,3] }`

### Отримати список чатів користувача
`GET /chats`

### Отримати повідомлення чату
`GET /chats/:chatId/messages`

## WebSocket
Підключення: `ws://localhost:3000` з auth токеном.

Події:
- `join-chats` (масив ID чатів)
- `send-message` (`{ chatId, content }`)
- `new-message` (отримання повідомлення)
