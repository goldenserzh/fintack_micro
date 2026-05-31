# FinTracker — Personal Finance Tracker with AI

Веб-приложение для отслеживания личных финансов с поддержкой AI-агента, визуализацией расходов и управлением бюджетом.

## Содержание

- [Технологии](#технологии)
- [Возможности](#возможности)
- [Структура проекта](#структура-проекта)
- [Запуск](#запуск)
- [Переменные окружения](#переменные-окружения)
- [API](#api)
- [Скриншоты](#скриншоты)

---

## Технологии

**Frontend**
- React 18 + TypeScript
- Vite
- React Router DOM 6
- Recharts (визуализация данных)
- Axios
- Context API (Auth, Theme)

**Backend**
- FastAPI (Python)
- PostgreSQL + SQLAlchemy ORM
- Alembic (миграции)
- JWT аутентификация (`python-jose`)
- Bcrypt (`passlib`)
- Pydantic v2

**DevOps**
- Docker & Docker Compose

---

## Возможности

**Аутентификация**
- Регистрация / вход с JWT-токенами (срок действия 30 дней)
- Первый зарегистрированный пользователь автоматически становится администратором
- Автоматический выход при истечении токена

**Финансовая панель**
- Добавление и удаление транзакций с категориями: Еда, Транспорт, Развлечения, Покупки, Здоровье, Другое
- Визуализация расходов по категориям (круговая диаграмма)
- Фильтры по периоду: неделя / месяц / год
- Отслеживание бюджетного лимита с предупреждениями
- Прогресс по финансовой цели

**Финансовый профиль**
- Установка ежемесячного дохода
- Установка лимита расходов
- Задание финансовой цели с целевой суммой

**Администрирование (только для admin)**
- Просмотр всех пользователей
- Создание, редактирование и удаление пользователей
- Каскадное удаление транзакций и профиля при удалении пользователя

**UI**
- Темная / светлая тема
- Toast-уведомления
- Адаптивный дизайн

---

## Структура проекта

```
finTrackerWithAI/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # auth, users, transactions, profile
│   │   ├── models/             # SQLAlchemy модели
│   │   ├── schemas/            # Pydantic схемы
│   │   ├── services/           # CRUD, AI-агент, финансовые расчёты
│   │   ├── core/               # config, security (JWT)
│   │   ├── main.py
│   │   └── database.py
│   ├── migrations/             # Alembic
│   ├── requirements.txt
│   ├── Dockerfile
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── pages/              # Login, Register, Dashboard, Profile, Settings
│   │   ├── components/         # SpendingChart, UsersList, UserDetail, CreateUser
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── api.ts
│   │   └── types.ts
│   ├── Dockerfile
│   └── package.json
├── bank_api/                   # В разработке
└── docker-compose.yaml
```

---

## Запуск

### Вариант 1: Docker Compose (рекомендуется)

```bash
git clone https://github.com/<your-username>/finTrackerWithAI.git
cd finTrackerWithAI

# Создай backend/.env (см. раздел «Переменные окружения»)

docker-compose up -d
```

Приложение будет доступно:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

---

### Вариант 2: Локальный запуск

**Требования:** Python 3.10+, Node.js 18+, PostgreSQL

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Настрой .env (см. ниже)

python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Переменные окружения

Создай файл `backend/.env`:

```env
USER_BD=postgres
PASSWORD_BD=postgres
HOST_DB=localhost
PORT_DB=5432
NAME_DB=fintracker

SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=30
```

---

## API

Базовый URL: `http://localhost:8000`

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/auth/register` | Регистрация |
| `POST` | `/auth/login` | Вход (возвращает JWT) |
| `GET` | `/users/` | Список пользователей (admin) |
| `GET` | `/users/{user_id}` | Данные пользователя |
| `PATCH` | `/users/{user_id}` | Обновление пользователя |
| `DELETE` | `/users/{user_id}` | Удаление пользователя |
| `GET` | `/transactions/{user_id}` | Транзакции пользователя |
| `POST` | `/transactions/{user_id}` | Создание транзакции |
| `DELETE` | `/transactions/{user_id}/{transaction_id}` | Удаление транзакции |
| `GET` | `/profile/{user_id}` | Финансовый профиль |
| `PATCH` | `/profile/{user_id}` | Обновление профиля |

Все защищённые эндпоинты требуют заголовка:
```
Authorization: Bearer <token>
```

Полная документация доступна по адресу `/docs` (Swagger UI).
---

<!-- 
![Dashboard](docs/screenshots/dashboard.png)
![Finance Profile](docs/screenshots/profile.png)
-->

---

