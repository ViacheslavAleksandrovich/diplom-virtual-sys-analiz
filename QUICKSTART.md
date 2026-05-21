# 🚀 QUICK START GUIDE

## Перший запуск проекту за 5 хвилин

### Передумови
- Docker і Docker Compose встановлені
- Git встановлений
- 4+ GB вільної памяті

### Крок 1: Клонування проекту
```bash
cd /home/acer/source
cd diplom-virtual-sys-analiz
```

### Крок 2: Налаштування змінних оточення
```bash
cp .env.example .env
# Можна залишити значення за замовчуванням
```

### Крок 3: Запуск контейнерів
```bash
docker-compose up --build
```

Чекайте ~3-5 хвилин на побудову образів та завантаження залежностей.

Ви побачите щось на кшталт:
```
backend_1     | Watching for file changes with StatReloader
frontend_1    | On Your Network: http://172.20.0.3:3000
postgres_1    | database system is ready to accept connections
```

### Крок 4: Ініціалізація бази даних (новий термінал)

`docker-compose` тепер автоматично виконує:
- `python manage.py migrate`
- `python manage.py seed_demo_data --quiet`

Тому після старту контейнерів уже доступні тестові модулі, теорія та задачі.

За потреби можна перезаповнити вручну:

```bash
docker-compose exec backend python manage.py seed_demo_data
docker-compose exec backend python manage.py createsuperuser
```

Введіть дані:
```
Username: admin
Email: admin@example.com
Password: ••••••••
```

### Крок 5: Доступ до сервісів

| Сервіс | URL |
|--------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Admin Panel** | http://localhost:8000/admin/ |
| **API Docs** | http://localhost:8000/api/docs/ |

---

## 🧪 Тестування API

### Через браузер

1. Відкрити http://localhost:8000/api/docs/
2. Переглянути OpenAPI schema (JSON)

### Через cURL

```bash
# Реєстрація
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "username": "student",
    "password": "securepass123",
    "password_confirm": "securepass123"
  }'

# Вхід
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securepass123"
  }'

# Отримання профіля
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:8000/api/auth/profile/
```

### Через Python/Requests

```python
import requests

# Реєстрація
response = requests.post('http://localhost:8000/api/auth/register/', json={
    'email': 'student@example.com',
    'username': 'student',
    'password': 'securepass123',
    'password_confirm': 'securepass123'
})

print(response.json())
# {'user': {...}, 'tokens': {'access': '...', 'refresh': '...'}}
```

---

## 📊 Адміністрування

### Доступ до Admin Panel

1. Перейти на http://localhost:8000/admin/
2. Увійти з superuser данними
3. Керувати моделями:
   - Users і Groups
   - Course Modules і Tasks
   - Achievements і Rankings

### Кількість дефолтних даних

База даних при першому запуску має демо-контент:
- 5 навчальних модулів
- 12+ теоретичних матеріалів
- 20 практичних завдань різних типів (multiple choice, text, calculation, matrix, hierarchy)
- стартові записи прогресу, статистики та рейтингу для студентів

Демо-акаунти (створюються сидером):
- `student.demo@example.com` / `DemoPass123!`
- `teacher.demo@example.com` / `DemoPass123!`
- `admin.demo@example.com` / `DemoPass123!`

### Додавання тестових даних

```bash
docker-compose exec backend python manage.py seed_demo_data
```

---

## 🔧 Розробка

### Backend розробка

```bash
# Редагувати код у backend/
# Зміни застосуються автоматично (auto-reload)

# Запустити тести
docker-compose exec backend python manage.py test

# Міграції
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### Frontend розробка

```bash
# Редагувати код у frontend/src/
# Зміни застосуються автоматично (hot reload)

# Виконати лінтинг
docker-compose exec frontend npm run lint

# Білд
docker-compose exec frontend npm run build
```

---

## 🐛 Проблеми та рішення

### Проблема: "docker not found"
```bash
# Встановіть Docker
# Linux: sudo apt-get install docker.io docker-compose
# macOS: Завантажте Docker Desktop
# Windows: Завантажте Docker Desktop
```

### Проблема: "Port 3000/8000 already in use"
```bash
# Змініть порти в .env
BACKEND_PORT=8001
FRONTEND_PORT=3001

# Або зупиніть потіючий сервіс
lsof -i :3000
kill -9 <PID>
```

### Проблема: "Database connection refused"
```bash
# Переконайтеся, що PostgreSQL запущена
docker-compose exec postgres pg_isready

# Перестартуйте контейнери
docker-compose restart postgres
```

### Проблема: "ModuleNotFoundError"
```bash
# Переінсталюйте залежності
docker-compose exec backend pip install -r requirements.txt
docker-compose exec frontend npm install
```

---

## 📚 Структура проекту

```
diplom-virtual-sys-analiz/
├── backend/           # Django backend (гарячий перезавантаження)
│   ├── config/       # Django settings
│   ├── apps/         # 5 apps: auth, course, checker, analytics, gamification
│   └── manage.py
├── frontend/          # React app (hot reload)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/  # API інтеграція
│   │   └── store/     # Auth
│   └── package.json
├── docker-compose.yml # Весь stack у одній команді
├── .env              # Змінні оточення
└── README.md         # Повна документація
```

---

## 🚦 Статус сервісів

### Перевірка статусу
```bash
docker-compose ps

# OUTPUT:
# NAME              STATUS
# sys_analiz_db     Up 2 minutes
# sys_analiz_backend   Up 2 minutes
# sys_analiz_frontend  Up 2 minutes
```

### Логи
```bash
# Всі логи
docker-compose logs -f

# Тільки backend
docker-compose logs -f backend

# Тільки frontend
docker-compose logs -f frontend
```

---

## 🔐 Безпека для розробки

Для локальної розробки безпека звільнена:
- DEBUG=True (не використовувати в production!)
- SECRET_KEY=dev-secret-key
- CORS дозволяє localhost:3000
- Email відправляється в консоль

Для production змініть у .env:
```env
DEBUG=False
SECRET_KEY=your-long-secret-key
```

---

## 💾 Резервне копіювання

### БД

```bash
# Дамп бази
docker-compose exec postgres pg_dump -U postgres sys_analiz > backup.sql

# Восстановлення
docker-compose exec -T postgres psql -U postgres sys_analiz < backup.sql
```

### Файли медіа

```bash
# Копіювання медіа папки
docker cp <container_id>:/app/media ./backup/media
```

---

## 🧹 Чистка

### Видалення контейнерів (без даних БД)
```bash
docker-compose down
```

### Повна чистка (включно з даними)
```bash
docker-compose down -v
```

### Перебудова образів
```bash
docker-compose build --no-cache
```

---

## 📖 Наступні кроки

1. Ознайомитись з [README.md](README.md)
2. Прочитати [PLAN.md](PLAN.md)
3. Дослідити API через [API Docs](http://localhost:8000/api/docs/)
4. Розвивати frontend компоненти
5. Додавати тести
6. Розгорнути на production

---

## 📞 Потрібна допомога?

1. Перевірити логи: `docker-compose logs`
2. Прочитати документацію в проекті
3. Перевірити .env налаштування
4. Перестартувати контейнери

---

**Готово! Система запущена і готова до розробки. 🚀**

Веб-інтерфейс доступний за адресою: **http://localhost:3000**
API документація: **http://localhost:8000/api/docs/**
