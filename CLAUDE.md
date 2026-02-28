# Cricket Bet Analyzer — IPL 2026

## Что это
AI-powered платформа для анализа ставок на крикет (IPL). Аналог нашего футбольного бет-анализера (SportScore AI / PreScoreAI), адаптированный под крикет и индийский рынок.

## Стек
- **Frontend:** React 18 + Vite + Tailwind CSS 3
- **Backend:** Python FastAPI + Claude API (Anthropic) + XGBoost ML
- **Deploy:** Railway (Docker) + Cloudflare Tunnel (dev)
- **Mobile:** Flutter (фаза 2)

## Структура проекта
```
web/                         # Фронтенд (React + Vite)
├── src/
│   ├── features/            # Feature-based архитектура
│   │   ├── auth/            # Авторизация (телефон + OTP)
│   │   ├── matches/         # Матчи, live-скоры, расписание IPL
│   │   ├── predictions/     # AI предикты через Claude, история
│   │   ├── betting/         # Value bets, сравнение коэфф., букмекеры
│   │   ├── tools/           # Калькуляторы (Kelly, Odds), гайды
│   │   └── admin/           # Админка (статистика, юзеры, ML)
│   └── shared/              # Общие модули
│       ├── api/             # HTTP клиент (fetch + auth)
│       ├── components/      # Layout, BottomNav, Spinner
│       ├── config/env.js    # Runtime конфиг (window.__APP_CONFIG__)
│       ├── context/         # Theme, Advertiser, BottomNav
│       ├── i18n/            # Мультиязычность (en, hi, ru)
│       ├── services/        # Analytics, geo, push notifications
│       └── utils/           # teamColors.js (IPL команды), helpers
├── public/config.js         # Runtime конфиг (переопределяется при деплое)
└── index.html

backend/                     # Бэкенд (FastAPI)
├── app/
│   ├── api/                 # REST endpoints
│   ├── services/            # Cricket API, AI анализ, ML pipeline
│   ├── models/              # SQLAlchemy (User, Prediction, etc.)
│   └── core/                # Database, security
└── requirements.txt

start-dev.sh                 # One-liner: Vite + FastAPI + Cloudflare Tunnel + Remote Control
SETUP-GUIDE.md               # Полный гайд по настройке
```

## Ключевые паттерны (из футбольного проекта — сохраняем!)
1. **Runtime-конфиг** — `window.__APP_CONFIG__` в `public/config.js`, приоритет: runtime → VITE_env → default. Один билд для всех доменов.
2. **Feature-based структура** — каждая фича = папка с api/, components/, pages/, services/, context/
3. **Lazy loading** — все страницы кроме Home загружаются через `React.lazy()`
4. **Degressive AI limits** — день 1: 3 запроса, день 2: 2, день 3+: 1 (premium = безлимит)
5. **AI Cache** — результат анализа матча кешируется на 24ч для всех юзеров
6. **Stale-while-revalidate** — показываем кеш сразу, обновляем в фоне
7. **PWA** — manifest.json, service worker, offline support

## Крикет-специфика (отличия от футбола)
- **Форматы:** T20 (IPL), ODI, Test — разные рынки ставок для каждого
- **Рынки ставок:** Match Winner, Top Batsman, Top Bowler, Total Runs O/U, First Innings Score, Match Fours/Sixes, Toss Winner, Man of the Match, Highest Partnership, Fall of 1st Wicket
- **Метрики игроков:** Batting Average, Strike Rate, Economy Rate, Bowling Average
- **Факторы анализа:** Pitch conditions, Toss impact, Dew factor, Venue history, Head-to-head
- **IPL 2026:** 10 команд, 84 матча, 28 марта — 31 мая

## IPL 2026 команды
CSK (Chennai Super Kings), MI (Mumbai Indians), RCB (Royal Challengers Bengaluru), KKR (Kolkata Knight Riders), DC (Delhi Capitals), SRH (Sunrisers Hyderabad), RR (Rajasthan Royals), PBKS (Punjab Kings), LSG (Lucknow Super Giants), GT (Gujarat Titans)

## API
- **Cricket Data (Premium):** [TBD — премиум API за $525/мес, название будет указано позже] — основной источник данных
- **Cricket Data (Backup):** CricketData.org или API-Sports — запасной вариант
- **Odds:** The Odds API (сравнение букмекеров)
- **AI:** Anthropic Claude API (анализ матчей)

## Правила
- Пиши код на английском, комментарии можно на русском
- Tailwind для стилей, никакого CSS-in-JS
- Mobile-first дизайн (основная аудитория — Индия, мобильный трафик)
- Цвета IPL команд в `src/shared/utils/teamColors.js`
- Vite config: `host: true` обязательно (для Cloudflare Tunnel)
- Все компоненты — функциональные (hooks, no classes)
