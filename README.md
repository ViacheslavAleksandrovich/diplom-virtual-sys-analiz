# Virtual Training Simulator for Distance Learning Course "System Analysis"

Інтерактивний веб-базований тренажер для дистанційного курсу "Системний аналіз" з підтримкою Методу Аналізу Ієрархій (АХП).

## 🎯 Проект

Дипломна робота на тему: "Інформаційне та програмне забезпечення віртуального тренажеру для дистанційного курсу 'Системний аналіз'"

## 📋 Вимоги

### Системні вимоги
- Docker 20.10+
- Docker Compose 1.29+
- Git

### Backend
- Python 3.11+
- PostgreSQL 15+

### Frontend
- Node.js 18+
- npm 9+

## 🚀 Швидкий старт

### 1. Клонування репозиторію

```bash
git clone <repository_url>
cd diplom-virtual-sys-analiz
```

### 2. Налаштування змінних оточення

```bash
cp .env.example .env
```

Оновіть параметри у `.env` файлі за необхідності.

### 3. Запуск з Docker Compose

```bash
docker-compose up --build
```

Після завершення:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

### 4. Першовідповіді налаштування Backend

```bash
# migrate + seed_demo_data запускаються автоматично при старті backend
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py seed_demo_data
```

Демо-акаунти після старту:
- `student.demo@example.com` / `DemoPass123!`
- `teacher.demo@example.com` / `DemoPass123!`
- `admin.demo@example.com` / `DemoPass123!`

### 5. Деплой на Render (Blueprint)

У репозиторії є готовий файл `render.yaml` для деплою в один клік.

Кроки:
```bash
git add render.yaml
git commit -m "Add Render blueprint"
git push
```

Далі у Render:
1. **Blueprints → New Blueprint Instance**
2. Виберіть цей репозиторій
3. Натисніть **Apply**

Render створить:
- web service для backend (`sys-analiz-backend`),
- static site для frontend (`sys-analiz-frontend`),
- PostgreSQL (`sys-analiz-db`).

## 📁 Структура проекту

```
diplom-virtual-sys-analiz/
├── backend/                    # Django backend
│   ├── config/                # Основні налаштування Django
│   ├── apps/
│   │   ├── auth_app/          # Аутентифікація та авторизація
│   │   ├── course_app/        # Управління курсами та модулями
│   │   ├── checker_app/       # Автоматична перевірка відповідей
│   │   ├── analytics_app/     # Аналітика та звітування
│   │   └── gamification_app/  # Система геймифікації
│   ├── requirements.txt
│   ├── manage.py
│   └── Dockerfile
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── pages/            # Сторінки додатку
│   │   ├── components/       # Компоненти React
│   │   ├── services/         # API сервіси
│   │   ├── store/            # Управління станом
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Утиліти
│   │   └── App.tsx           # Основний компонент
│   ├── package.json
│   ├── Dockerfile
│   └── public/
├── docker/                    # Docker конфігурація
├── docker-compose.yml         # Docker Compose налаштування
├── .env.example              # Приклад змінних оточення
└── PLAN.md                   # План проекту
```

## 🔧 Технологічний стек

### Backend
- **Django 4.2** - веб-фреймворк
- **Django REST Framework** - REST API
- **PostgreSQL** - база даних
- **JWT** - аутентифікація
- **NumPy, SciPy** - математичні розрахунки

### Frontend
- **React 18** - UI бібліотека
- **React Router** - маршрутизація
- **Axios** - HTTP клієнт
- **Tailwind CSS** - стилізація
- **MathJax** - рендеринг формул

### DevOps
- **Docker** - контейнеризація
- **Docker Compose** - оркестрація контейнерів
- **Nginx** - веб-сервер (для production)

## 📚 Функціональність

### Для студентів
- ✅ Реєстрація та аутентифікація
- ✅ Перегляд модулів/завдань та відправка відповідей через API
- ✅ Система АХП (Analytic Hierarchy Process)
- ✅ Автоматична перевірка відповідей
- ✅ Відстеження прогресу (backend)
- ⏳ TheoryViewer (MathJax), TaskRunner, StudentDashboard (у розробці)

### Для викладачів
- ✅ Управління модулями та завданнями (backend API + admin)
- ✅ Аналітика успішності (backend API)
- ⏳ TeacherPanel UI, розширені екрани статистики (у розробці)

### Для адміністраторів
- ✅ Управління користувачами
- ✅ Налаштування системи (через Django Admin/.env)
- ⏳ Автоматизоване резервне копіювання (планується)

## 🔐 Безпека

- JWT токени для аутентифікації
- RBAC (Role-Based Access Control)
- Хешування паролів
- CORS захист
- CSRF захист
- XSS захист

## 📊 Система оцінювання

### Рівні складності задач
- **Рівень 1** - Репродуктивний (базовий)
- **Рівень 2** - Аналітичний (середній)
- **Рівень 3** - Творчий (підвищений)

### Система балів
- Перша спроба: 100%
- Друга спроба: 70%
- Третя та подальші: 50%
- При використанні підказки: ×0.8

## 🧮 Модуль АХП (Analytic Hierarchy Process)

Система підтримує:
- Побудову матриць попарного порівняння
- Розрахунок векторів пріоритетів
- Обчислення індексу узгодженості (CR)
- Перевірку узгодженості суджень

Допуск похибки: ±0.01

## 📈 Аналітика

Система відстежує:
- Прогрес студентів по модулям
- Середню оцінку за завдання
- Відсоток успішності
- Динаміку засвоєння матеріалу
- Рекомендації для подальшого навчання

## 🔄 Методика використання

### Три фази навчання:
1. **Вивчай (Learn)** - опрацювання теорії
2. **Практикуй (Practice)** - виконання завдань без обмежень
3. **Перевіряй (Assess)** - контрольні тести

## 🐛 Розробка

### Backend розробка

```bash
# Перейти до backend директорії
cd backend

# Встановити залежності
pip install -r requirements.txt

# Створити міграції
python manage.py makemigrations

# Застосувати міграції
python manage.py migrate

# Запустити сервер
python manage.py runserver
```

### Frontend розробка

```bash
# Перейти до frontend директорії
cd frontend

# Встановити залежності
npm install

# Запустити development сервер
npm start

# Запустити тести
npm test
```

## 📝 Логування

Логи зберігаються у `backend/logs/django.log`

## 🧪 Тестування

```bash
# Запустити тести backend
docker-compose exec backend python manage.py test

# Запустити тести frontend
docker-compose exec frontend npm test
```

## 📚 Документація API

OpenAPI schema доступна за адресою:
```
http://localhost:8000/api/docs/
```

## 🚀 Production skeleton

- Nginx reverse-proxy config: `docker/nginx.conf`
- CI pipeline: `.github/workflows/ci.yml`
- Compose override for production profile: `docker-compose.prod.yml`

Запуск production-конфігурації:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## 🤝 Внесення вклад

1. Створіть feature branch (`git checkout -b feature/AmazingFeature`)
2. Зробіть коміти вашим змінам (`git commit -m 'Add some AmazingFeature'`)
3. Запушіть до гілки (`git push origin feature/AmazingFeature`)
4. Відкрийте Pull Request

## 📄 Ліцензія

Цей проект є частиною дипломної роботи.

## 📞 Контакти

Для запитань та пропозицій розташуйте issue у репозиторію.

## 🗺️ Дорожна карта

### Фаза 1 ✅
- [x] Ініціалізація проекту
- [x] Налаштування Docker

### Фаза 2 ✅
- [x] Система аутентифікації

### Фаза 3 ⏳
- [x] Моделі бази даних
- [x] REST API

### Фаза 4 ⏳
- [x] Frontend структура
- [ ] Компоненти UI

### Фаза 5-11 ⏳
- [ ] Модулі теорії
- [ ] Система завдань
- [ ] Автоматична перевірка
- [ ] Аналітика
- [ ] Геймифікація
- [ ] Тестування
- [ ] Deployment

## 📖 Додатково

- [PLAN.md](PLAN.md) - Детальний план проекту
- [DOCS.md](DOCS.md) - Документація (Українська мова)
