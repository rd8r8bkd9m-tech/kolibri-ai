# Kolibri PLASTER Module 🏗️

**Модуль управления штукатурными работами для платформы Kolibri**

> Полнофункциональное решение для управления проектами штукатурных работ с интеграцией AI диагностики и ML прогнозирования.

---

## 📋 Содержание

- [Обзор](#обзор)
- [Возможности](#возможности)
- [Быстрый старт](#быстрый-старт)
- [Архитектура](#архитектура)
- [API Reference](#api-reference)
- [Компоненты](#компоненты)
- [ML Модули](#ml-модули)
- [Мобильное приложение](#мобильное-приложение)
- [База данных](#база-данных)
- [Тестирование](#тестирование)
- [Развертывание](#развертывание)

---

## 🎯 Обзор

PLASTER — это специализированный модуль платформы Kolibri для полного цикла управления штукатурными работами:

- **Управление проектами** — от планирования до сдачи
- **Учет материалов** — калькуляция, склад, поставщики
- **Управление рабочими** — назначения, учет времени, зарплаты
- **Контроль качества** — чек-листы, фото, дефекты
- **Финансы** — сметы, платежи, прибыльность
- **AI диагностика** — анализ фото дефектов
- **ML прогнозирование** — сроки, риски, оптимизация

---

## ✨ Возможности

### Управление проектами
- Создание проектов с адресом, площадью, типом помещения
- Виды штукатурки: выравнивающая, декоративная, финишная, гипсовая, цементная
- Этапы работ: подготовка → грунтовка → маяки → нанесение → выравнивание → отделка
- Отслеживание прогресса и дедлайнов
- Фото до/после

### Материалы
- Каталог материалов с ценами
- Калькулятор: м² → кг штукатурки
- Учет остатков на складе
- Автоматические уведомления о низком запасе
- Справочник поставщиков

### Рабочие
- Профили с квалификацией и рейтингом
- Назначение на проекты и этапы
- Учет рабочего времени
- Расчет производительности (м²/день)
- Начисление зарплаты

### Контроль качества
- Чек-лист проверки (ровность, адгезия, толщина)
- Регистрация и классификация дефектов
- Фото документация
- Рекомендации по исправлению
- Отслеживание гарантийных обязательств

### Финансы
- Автоматическая генерация смет
- Позиционная смета (материалы + работы)
- Учет платежей (авансы, этапы, итоговые)
- Расчет прибыльности
- Сравнение с рыночными ценами

### AI/ML
- **Диагностика дефектов** — анализ фото, определение типа и серьезности
- **Прогноз сроков** — дата завершения на основе текущего темпа
- **Оценка рисков** — сроки, бюджет, качество, ресурсы
- **Оптимизация ресурсов** — рекомендации по количеству рабочих
- **Расчет сметы** — ML модель на исторических данных

---

## 🚀 Быстрый старт

### Предварительные требования

```bash
Node.js 18+
Python 3.10+
PostgreSQL 14+
npm или yarn
```

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/rd8r8bkd9m-tech/kolibri-ai.git
cd kolibri-ai/modules/plaster

# Установка зависимостей API
npm install

# Установка Python зависимостей для ML
pip install -r requirements.txt
```

### Инициализация базы данных

```bash
# Создание схемы
psql -U postgres -d kolibri -f schema.sql
```

### Запуск

```bash
# API сервер
npm start

# Для разработки
npm run dev
```

---

## 🏗️ Архитектура

```
modules/plaster/
├── config.json                 # Конфигурация модуля
├── schema.sql                  # PostgreSQL схема
├── README.md                   # Документация
├── api/
│   ├── projects.js            # API проектов
│   ├── materials.js           # API материалов
│   ├── workers.js             # API рабочих
│   ├── quality.js             # API качества
│   └── financials.js          # API финансов
├── ml/
│   ├── diagnosis.py           # AI диагностика
│   ├── prediction.py          # ML прогнозирование
│   └── cost_estimation.py     # Расчет смет
├── components/
│   ├── ProjectCard.tsx        # Карточка проекта
│   ├── MaterialCalculator.tsx # Калькулятор материалов
│   ├── WorkerSchedule.tsx     # Расписание рабочих
│   ├── PhotoDiagnosis.tsx     # AI диагностика фото
│   └── Dashboard.tsx          # Дашборд
├── mobile/
│   ├── screens/
│   │   ├── ProjectsScreen.js
│   │   ├── TasksScreen.js
│   │   ├── PhotoUploadScreen.js
│   │   └── ProgressScreen.js
│   └── navigation/
│       └── AppNavigation.js
└── tests/
    ├── materials.test.js
    ├── workers.test.js
    └── diagnosis.test.js
```

---

## 📡 API Reference

### Проекты

```http
GET    /api/plaster/projects              # Список проектов
GET    /api/plaster/projects/:id          # Получить проект
POST   /api/plaster/projects              # Создать проект
PUT    /api/plaster/projects/:id          # Обновить проект
DELETE /api/plaster/projects/:id          # Удалить проект
GET    /api/plaster/projects/:id/stages   # Этапы проекта
PUT    /api/plaster/projects/:id/stages/:stageId  # Обновить этап
```

#### Создание проекта

```bash
curl -X POST /api/plaster/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Квартира на Невском",
    "address": "Невский пр. 150, кв. 45",
    "area_sqm": 75,
    "room_type": "residential",
    "plaster_type": "leveling",
    "deadline": "2024-03-01",
    "budget": 150000
  }'
```

### Материалы

```http
GET    /api/plaster/materials             # Список материалов
POST   /api/plaster/materials             # Добавить материал
POST   /api/plaster/materials/calculate   # Калькулятор
GET    /api/plaster/inventory/list        # Остатки на складе
POST   /api/plaster/inventory/add         # Поступление
POST   /api/plaster/inventory/consume     # Списание
```

#### Калькуляция материалов

```bash
curl -X POST /api/plaster/materials/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "area_sqm": 100,
    "plaster_type": "leveling",
    "thickness_mm": 15
  }'
```

### Рабочие

```http
GET    /api/plaster/workers               # Список рабочих
POST   /api/plaster/workers               # Добавить рабочего
POST   /api/plaster/workers/assign        # Назначить на проект
POST   /api/plaster/workers/time          # Записать время
GET    /api/plaster/workers/:id/time      # История времени
POST   /api/plaster/workers/:id/payment   # Расчет зарплаты
GET    /api/plaster/workers/productivity/report  # Отчет производительности
```

### Качество

```http
GET    /api/plaster/quality/checklist     # Шаблон чек-листа
POST   /api/plaster/quality/check         # Проверка качества
POST   /api/plaster/quality/defect        # Регистрация дефекта
PUT    /api/plaster/quality/defects/:id   # Обновить дефект
POST   /api/plaster/quality/photo         # Загрузить фото
GET    /api/plaster/quality/report/:projectId  # Отчет по качеству
```

### Финансы

```http
POST   /api/plaster/financials/estimate           # Создать смету
POST   /api/plaster/financials/estimate/generate  # Авто-генерация
POST   /api/plaster/financials/payment            # Записать платеж
GET    /api/plaster/financials/payments/:projectId  # Платежи проекта
GET    /api/plaster/financials/profitability/:projectId  # Прибыльность
GET    /api/plaster/financials/summary            # Финансовая сводка
```

---

## 🎨 Компоненты

### ProjectCard
Карточка проекта для списка и дашборда.

```tsx
<ProjectCard
  project={project}
  onClick={(p) => navigate(`/project/${p.id}`)}
  onEdit={(p) => openEditModal(p)}
  compact={false}
/>
```

### MaterialCalculator
Калькулятор расхода материалов.

```tsx
<MaterialCalculator
  initialArea={100}
  onCalculate={(result) => console.log(result)}
  onAddToProject={(materials) => addMaterials(materials)}
/>
```

### WorkerSchedule
Расписание и управление рабочими.

```tsx
<WorkerSchedule
  workers={workers}
  assignments={assignments}
  onAssign={(workerId, projectId, dates) => assignWorker(...)}
/>
```

### PhotoDiagnosis
AI анализ фото дефектов.

```tsx
<PhotoDiagnosis
  projectId="project_123"
  onDiagnosisComplete={(result) => handleResult(result)}
  onSaveDefect={(defect) => saveDefect(defect)}
/>
```

### Dashboard
Главная панель управления.

```tsx
<Dashboard
  stats={dashboardStats}
  recentProjects={projects}
  alerts={alerts}
  onNavigate={(section) => navigate(section)}
/>
```

---

## 🤖 ML Модули

### diagnosis.py — AI Диагностика

```python
from ml.diagnosis import analyze_photo, batch_analyze

# Анализ одного фото
result = analyze_photo("/path/to/image.jpg", project_id="p1")

# Пакетный анализ
results = batch_analyze(["/img1.jpg", "/img2.jpg"], project_id="p1")
```

**Определяемые дефекты:**
- Трещины (crack)
- Сколы (chip)
- Неровности (unevenness)
- Отслоения (delamination)
- Высолы (efflorescence)
- Плесень (mold)

### prediction.py — ML Прогнозирование

```python
from ml.prediction import predict_completion, assess_project_risks

# Прогноз завершения
result = predict_completion(
    project_id="p1",
    area_sqm=150,
    current_progress=35,
    days_elapsed=7,
    workers_count=3,
    defects=2
)

# Оценка рисков
risks = assess_project_risks("p1", progress=35, days_elapsed=7, budget_spent=40, defects=2)
```

### cost_estimation.py — Расчет Смет

```python
from ml.cost_estimation import calculate_estimate, quick_estimate

# Полный расчет
estimate = calculate_estimate(
    area_sqm=100,
    plaster_type="leveling",
    room_type="residential",
    complexity="standard",
    region="moscow"
)

# Быстрый расчет
quick = quick_estimate(100, "decorative")
```

---

## 📱 Мобильное приложение

### Экраны

1. **ProjectsScreen** — список проектов с поиском и фильтрами
2. **TasksScreen** — задачи на день для рабочего
3. **PhotoUploadScreen** — загрузка фото прогресса/дефектов
4. **ProgressScreen** — статистика и история работ

### Установка

```bash
cd mobile
npm install
npx react-native run-android  # Android
npx react-native run-ios      # iOS
```

---

## 💾 База данных

### Основные таблицы

| Таблица | Описание |
|---------|----------|
| `projects` | Проекты |
| `project_stages` | Этапы работ |
| `materials` | Справочник материалов |
| `inventory` | Остатки на складе |
| `workers` | Рабочие |
| `worker_assignments` | Назначения |
| `time_entries` | Учет времени |
| `quality_checks` | Проверки качества |
| `defects` | Дефекты |
| `photos` | Фотографии |
| `estimates` | Сметы |
| `payments` | Платежи |

### Представления (Views)

- `v_project_summary` — сводка по проекту
- `v_worker_productivity` — производительность рабочих
- `v_material_inventory` — состояние склада

---

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Конкретный тест
npm test -- materials.test.js

# С покрытием
npm test -- --coverage
```

### Python ML тесты

```bash
cd ml
python -m pytest test_diagnosis.py -v
python -m pytest test_prediction.py -v
```

---

## 🚀 Развертывание

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t kolibri-plaster .
docker run -p 3000:3000 kolibri-plaster
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/kolibri
    depends_on:
      - db
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=kolibri
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  pgdata:
```

---

## 📝 Конфигурация

### config.json

```json
{
  "name": "plaster",
  "version": "1.0.0",
  "features": {
    "projects": { "enabled": true },
    "materials": { "enabled": true },
    "workers": { "enabled": true },
    "quality": { "enabled": true },
    "financials": { "enabled": true },
    "ai_diagnosis": { "enabled": true },
    "ml_prediction": { "enabled": true }
  },
  "api": {
    "basePath": "/api/plaster",
    "rateLimit": 100,
    "timeout": 30000
  }
}
```

---

## 🔒 Безопасность

- JWT аутентификация для API
- Шифрование паролей (bcrypt)
- Валидация входных данных
- Rate limiting
- CORS защита
- Аудит изменений в БД

---

## 📄 Лицензия

AGPL-3.0 — см. [LICENSE](../../LICENSE-AGPL.md)

---

## 👥 Поддержка

- **GitHub Issues**: https://github.com/rd8r8bkd9m-tech/kolibri-ai/issues
- **Документация**: /docs

---

**Made with ❤️ by Kolibri Platform Team**
