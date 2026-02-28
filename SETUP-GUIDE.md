# 🏏 Cricket Bet Analyzer — IPL 2026
## Полный гайд: проект + Remote Control + Cloudflare Tunnel

---

## Архитектура проекта

```
cricket-bet-analyzer/
├── web/                    # React + Vite (фронтенд)
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/       # Авторизация (телефон, OTP)
│   │   │   ├── matches/    # Матчи IPL, live-скоры
│   │   │   ├── predictions/ # AI-предикты (Claude API)
│   │   │   ├── betting/    # Value bets, коэффициенты
│   │   │   ├── tools/      # Калькуляторы, гайды
│   │   │   └── admin/      # Админка
│   │   └── shared/         # API, компоненты, i18n, utils
│   └── public/
├── backend/                # Python FastAPI (бэкенд)
│   └── app/
│       ├── api/            # Эндпоинты
│       ├── services/       # Cricket API, AI анализ, ML
│       ├── models/         # SQLAlchemy модели
│       └── core/           # БД, секьюрити
├── server/                 # Node.js proxy
└── mobile_app/             # Flutter (фаза 2)
```

---

## Часть 1: Настройка окружения

### 1.1 Что нужно на твоём компе

```bash
# Node.js 18+ (для фронта)
node -v  # должно быть 18+

# Python 3.11+ (для бэка)
python3 --version

# Claude Code (CLI)
npm install -g @anthropic-ai/claude-code

# Cloudflare Tunnel
# macOS:
brew install cloudflared
# Linux:
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# Git
git --version
```

### 1.2 Клонируем проект и ставим зависимости

```bash
# Создаём репо
mkdir cricket-bet-analyzer && cd cricket-bet-analyzer
git init

# Фронтенд
cd web
npm install

# Бэкенд (в отдельном терминале)
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 1.3 Переменные окружения

Создай `web/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_CRICKET_KEY=your_cricket_api_key
VITE_GEO_SERVER_URL=http://localhost:3001
```

Создай `backend/.env`:
```env
SECRET_KEY=your-random-secret-key-here
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/cricket_db
CLAUDE_API_KEY=sk-ant-xxxxx
CRICKET_API_KEY=your_cricket_api_key
THE_ODDS_API_KEY=your_odds_api_key
```

---

## Часть 2: Запуск локальной разработки

### 2.1 Запускаем всё локально

Открой 3 терминала:

**Терминал 1 — Фронтенд:**
```bash
cd cricket-bet-analyzer/web
npm run dev
# → http://localhost:5173
```

**Терминал 2 — Бэкенд:**
```bash
cd cricket-bet-analyzer/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
```

**Терминал 3 — будет для Claude Code (см. далее)**

---

## Часть 3: Remote Control — управляй с телефона

### Что это даёт
Ты сидишь в кафе/на диване → открываешь Claude на телефоне → пишешь "добавь компонент LiveScore на главную" → Claude Code на твоём компе пишет код → фронт автоматически перезагружается через HMR → ты видишь результат через Cloudflare Tunnel.

### 3.1 Настройка

```bash
# Убедись что Claude Code авторизован
claude
# Если нет — выполни /login и авторизуйся через claude.ai

# Перейди в директорию проекта
cd ~/cricket-bet-analyzer

# Запусти Remote Control
claude remote-control

# Или если уже в сессии Claude Code:
# /remote-control   (или /rc)
```

### 3.2 Что ты увидишь в терминале

```
╔══════════════════════════════════════════════╗
║  Remote Control Session Active               ║
║                                              ║
║  URL: https://claude.ai/code/session/abc123  ║
║                                              ║
║  Press [Space] to show QR code               ║
║  Press [Q] to stop                           ║
╚══════════════════════════════════════════════╝
```

### 3.3 Подключение с телефона

**Способ 1:** Открой URL из терминала в браузере телефона
**Способ 2:** Нажми пробел → отсканируй QR-код камерой → откроется Claude app
**Способ 3:** Открой Claude app → вкладка Code → найди сессию по имени

### 3.4 Лайфхаки

```bash
# Дай сессии понятное имя ДО запуска remote control
/rename Cricket IPL Analyzer

# Автоматический Remote Control для всех сессий:
/config
# → "Enable Remote Control for all sessions" → true

# С sandbox-ом (изоляция файловой системы):
claude remote-control --sandbox
```

### 3.5 Ограничения

- Нужна подписка **Max** (скоро Pro)
- Одна remote-сессия на инстанс
- Терминал должен быть открыт
- Отключение от сети > 10 мин = сессия умирает
- API ключи не поддерживаются, только подписка

---

## Часть 4: Cloudflare Tunnel — смотри localhost с любого устройства

### Что это даёт
Твой `localhost:5173` (фронт) получает публичный URL. Открываешь его на телефоне — видишь свой сайт. При этом через Remote Control ты меняешь код → HMR обновляет страницу → ты видишь изменения в реальном времени.

### 4.1 Быстрый старт (без аккаунта Cloudflare)

```bash
# Самый простой способ — Quick Tunnel (временный URL)
cloudflared tunnel --url http://localhost:5173

# Вывод:
# +-----------------------------------------------------------+
# | Your quick tunnel has been created!                        |
# | https://random-words-here.trycloudflare.com               |
# +-----------------------------------------------------------+

# Этот URL работает пока запущен cloudflared
# Открой его на телефоне — увидишь свой фронтенд!
```

### 4.2 Проброс нескольких портов

```bash
# Терминал A — фронтенд
cloudflared tunnel --url http://localhost:5173
# → https://abc-xyz.trycloudflare.com (фронт)

# Терминал B — бэкенд API (если нужен)
cloudflared tunnel --url http://localhost:8000
# → https://def-uvw.trycloudflare.com (API)
```

Либо через конфиг:

### 4.3 Постоянный туннель (с аккаунтом Cloudflare)

```bash
# Логин
cloudflared tunnel login

# Создание туннеля
cloudflared tunnel create cricket-dev

# Конфиг ~/.cloudflared/config.yml:
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/cert.pem

ingress:
  - hostname: cricket-dev.yourdomain.com
    service: http://localhost:5173
  - hostname: cricket-api.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404

# Запуск
cloudflared tunnel run cricket-dev
```

### 4.4 Важные нюансы для Vite

Vite по умолчанию слушает только localhost. Для работы через туннель нужно:

```js
// vite.config.js
export default defineConfig({
  server: {
    host: true,           // Слушать на 0.0.0.0
    port: 5173,
    hmr: {
      // Для HMR через туннель (опционально, если HMR не работает):
      // clientPort: 443,
      // host: 'your-tunnel-url.trycloudflare.com',
    },
  },
  // ...
});
```

---

## Часть 5: Полный workflow — всё вместе

### Утренний старт (за компом)

```bash
# 1. Запускаем фронт
cd ~/cricket-bet-analyzer/web && npm run dev &

# 2. Запускаем бэк
cd ~/cricket-bet-analyzer/backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000 &

# 3. Запускаем Cloudflare Tunnel
cloudflared tunnel --url http://localhost:5173 &
# Записываем URL: https://xxx.trycloudflare.com

# 4. Запускаем Claude Code с Remote Control
cd ~/cricket-bet-analyzer
claude remote-control
# Сканируем QR с телефона
```

### Работа с телефона (на диване/в дороге)

```
[Ты на телефоне в Claude app через Remote Control]

Ты: "Добавь компонент IPLSchedule который показывает расписание
     матчей на сегодня с командами и временем начала"

Claude Code (на твоём компе):
  → Создаёт файл src/features/matches/components/IPLSchedule.jsx
  → Подключает в роутер
  → Vite HMR мгновенно обновляет страницу

[Ты открываешь https://xxx.trycloudflare.com на телефоне]
→ Видишь новый компонент в реальном времени
→ Проверяешь как выглядит на мобилке
→ Пишешь Claude: "Отступы слишком большие, уменьши padding"
→ Claude правит → видишь обновление
```

### Диаграмма потока

```
┌─────────────┐     Claude API      ┌──────────────────┐
│  Телефон    │ ◄──────────────────► │  claude.ai       │
│  (Claude    │   (Remote Control)   │  (сервер)        │
│   App)      │                      └────────┬─────────┘
└──────┬──────┘                               │
       │                                      │ Команды
       │ Просмотр                             ▼
       │ результата          ┌──────────────────────────┐
       │                     │  Твой комп (localhost)    │
       │                     │                          │
       │                     │  ┌─────────────────────┐ │
       │  Cloudflare         │  │ Claude Code CLI     │ │
       │  Tunnel             │  │ (пишет/меняет код)  │ │
       │                     │  └──────────┬──────────┘ │
       │                     │             │            │
       │                     │             ▼            │
       │                     │  ┌─────────────────────┐ │
       └─────────────────────┼─►│ Vite Dev Server     │ │
         https://xxx.        │  │ :5173 (HMR)         │ │
         trycloudflare.com   │  └─────────────────────┘ │
                             │                          │
                             │  ┌─────────────────────┐ │
                             │  │ FastAPI Backend      │ │
                             │  │ :8000                │ │
                             │  └─────────────────────┘ │
                             └──────────────────────────┘
```

---

## Часть 6: One-liner скрипт для запуска всего

Создай файл `start-dev.sh` в корне проекта:

```bash
#!/bin/bash
# Cricket Bet Analyzer — полный dev environment

echo "🏏 Starting Cricket Bet Analyzer Dev Environment..."

# Цвета для терминала
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Frontend
echo -e "${GREEN}[1/4] Starting frontend...${NC}"
cd web && npm run dev &
FRONTEND_PID=$!
sleep 3

# 2. Backend
echo -e "${GREEN}[2/4] Starting backend...${NC}"
cd ../backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
sleep 2

# 3. Cloudflare Tunnel
echo -e "${BLUE}[3/4] Starting Cloudflare Tunnel...${NC}"
cloudflared tunnel --url http://localhost:5173 &
TUNNEL_PID=$!
sleep 5

# 4. Claude Code Remote Control
echo -e "${YELLOW}[4/4] Starting Claude Code Remote Control...${NC}"
echo -e "${YELLOW}Scan QR code with your phone to connect!${NC}"
cd ..
claude remote-control

# Cleanup on exit
trap "kill $FRONTEND_PID $BACKEND_PID $TUNNEL_PID 2>/dev/null" EXIT
```

Сделай исполняемым:
```bash
chmod +x start-dev.sh
```

Запуск — одна команда:
```bash
./start-dev.sh
```

---

## Часть 7: Git + Deploy Pipeline

### 7.1 Структура веток

```
main          ← продакшн (авто-деплой)
├── develop   ← основная ветка разработки
├── feature/* ← новые фичи
└── hotfix/*  ← срочные фиксы
```

### 7.2 Deploy на Railway

```bash
# Первичная настройка
railway login
railway link

# Деплой фронта
cd web && railway up

# Деплой бэка
cd backend && railway up
```

### 7.3 GitHub Actions (авто-деплой при push в main)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: cd web && npm ci && npm run build
      - uses: railwayapp/deploy@v1
        with:
          service: cricket-web
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/deploy@v1
        with:
          service: cricket-backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Часть 8: API для крикета

### Рекомендуемые API

| API | Цена | Что даёт | Для чего |
|-----|-------|----------|----------|
| **The Odds API** | Free tier (500 req/мес) | Коэффициенты от 15+ букмекеров | Value bets, сравнение коэфф. |
| **CricketData.org** | $5.99/мес | Ball-by-ball, live скоры, скоркарды | Live матчи, статистика |
| **API-Sports** | $10/мес | Unified API для всех видов спорта | Расписание, составы, standings |
| **Claude API** | Pay per use | AI-анализ матчей | Предикты, AI-чат |

### Крикетные рынки ставок (IPL)

```
Match Winner          — кто победит
Top Batsman           — лучший бэтсмен матча
Top Bowler            — лучший боулер матча
Total Runs O/U        — тотал ранов (больше/меньше)
First Innings Score   — очки первого иннингса
Match Fours           — количество "четвёрок"
Match Sixes           — количество "шестёрок"
Toss Winner           — кто выиграет жеребьёвку
Man of the Match      — лучший игрок матча
Highest Partnership   — лучшая пара бэтсменов
Fall of First Wicket  — когда упадёт первый виккет
```

---

## Таймлайн до IPL (28 марта 2026)

| Неделя | Даты | Задачи | Статус |
|--------|------|--------|--------|
| **1** | 28 фев — 7 мар | Ядро: Vite + React + API + базовый дашборд | 🔄 В работе |
| **2** | 7 — 14 мар | Анализ коэффициентов, value bets, сравнение букмекеров | ⏳ |
| **3** | 14 — 21 мар | AI-предикты (Claude), крикет-метрики, pitch analysis | ⏳ |
| **4** | 21 — 28 мар | UI polish, тестирование, деплой в прод | ⏳ |
| **🏏** | **28 марта** | **IPL 2026 стартует — РЕЛИЗ!** | 🎯 |
