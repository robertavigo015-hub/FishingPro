// Сборка: node tools/build.mjs
// dist/      — для хостинга и Telegram (index.html + game.js)
// preview/   — один файл без скрипта Telegram, для просмотра в браузере
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const res = await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  charset: 'utf8',
  write: false,
});
const js = res.outputFiles[0].text;
const html = readFileSync('web/index.html', 'utf8');

mkdirSync('dist', { recursive: true });
writeFileSync('dist/game.js', js);
writeFileSync(
  'dist/index.html',
  html
    .replace('<!--TELEGRAM-->', '<script src="https://telegram.org/js/telegram-web-app.js"></script>')
    .replace('<!--GAME-->', `<script src="game.js?v=${Date.now()}" charset="utf-8"></script>`),
);

mkdirSync('preview', { recursive: true });
writeFileSync('preview/index.html', html.replace('<!--TELEGRAM-->', '').replace('<!--GAME-->', `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`));
console.log('game.js', (js.length / 1024).toFixed(1), 'KB');
