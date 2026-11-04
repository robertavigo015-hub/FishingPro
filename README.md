# Рыбалка Про — Telegram Mini App

Зона 1 «Родной пруд» (до 300 м). Phaser 3.90 (подключается с jsDelivr) + TypeScript, сборка esbuild.

## Структура
- `src/` — код игры (`data.ts` — рыбы и магазин, `scenes/` — экраны)
- `web/index.html` — шаблон страницы
- `dist/` — готовая сборка для хостинга: **index.html + game.js**
- `preview/` — однофайловая версия для просмотра без Telegram
- `publish-bot.cmd` / `publish-bot.ps1` — привязка игры к боту
- `../secrets.json` — токен бота; лежит уровнем выше репозитория и в git не попадает

## Сборка
```
npm install
npm run build
```

## Публикация
1. Загрузите содержимое `dist/` на любой HTTPS-хостинг (GitHub Pages, Netlify, Cloudflare Pages).
2. Запустите `publish-bot.cmd` и вставьте адрес игры. Скрипт сам прочитает токен из
   `../secrets.json`, поставит боту кнопку «Играть» и описание. Токен на экран не выводится.
3. Адрес сохранится в `bot-config.json`; при следующем запуске его не нужно вводить.
