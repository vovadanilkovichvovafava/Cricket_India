# Стартовый промпт для Claude Code

Скопируй и вставь это в первую сессию Claude Code после того как откроешь проект.

---

## Промпт:

```
Разберись в проекте. Прочитай CLAUDE.md и SETUP-GUIDE.md.

Это крикетный бет-анализер для IPL 2026 (старт 28 марта). Архитектура и паттерны описаны в CLAUDE.md.

Сейчас в web/ есть базовый React+Vite проект с:
- Home page с моковыми матчами IPL
- Feature-based структура (auth, matches, predictions, betting, tools, admin)
- Runtime конфиг (window.__APP_CONFIG__)
- IPL team colors

Задачи на первый спринт (неделя 1):

1. Подключи Cricket API — создай сервис в web/src/features/matches/api/cricketApi.js. Используй премиум API (ключ в .env как CRICKET_API_KEY), если ещё нет ключа — используй CricketData.org как временную замену.

2. Замени мок-данные на Home реальными из API — предстоящие матчи IPL, live scores если есть.

3. Сделай страницу MatchDetail — детальная карточка матча с:
   - Составы команд (batting/bowling lineups)
   - Venue stats (история стадиона)
   - Head-to-head статистика
   - Odds comparison от разных букмекеров
   - AI prediction button

4. Сделай страницу Matches — полное расписание IPL с фильтрами по дате и команде.

5. Настрой бэкенд — создай backend/ по аналогии с футбольным, но с крикетными эндпоинтами:
   - /api/v1/cricket/matches — список матчей
   - /api/v1/cricket/match/:id — детали матча
   - /api/v1/cricket/ipl/standings — таблица IPL
   - /api/v1/predictions/:matchId — AI анализ через Claude

Начни с пункта 1 и двигайся последовательно. После каждого шага проверяй что npm run dev работает без ошибок.
```

---

## Как использовать

1. Создай папку проекта:
```bash
mkdir ~/cricket-bet-analyzer
cd ~/cricket-bet-analyzer
```

2. Распакуй cricket-bet-analyzer.zip сюда

3. Поставь зависимости:
```bash
cd web && npm install && cd ..
```

4. Запусти Claude Code:
```bash
claude
```

5. Вставь промпт выше

6. Для Remote Control:
```bash
/rename Cricket IPL Analyzer
/rc
```
→ Сканируй QR с телефона и продолжай работу оттуда
