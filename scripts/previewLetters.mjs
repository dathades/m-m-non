import { readFileSync, writeFileSync } from 'node:fs';

const ts = readFileSync(new URL('../src/lib/letterStrokes.ts', import.meta.url), 'utf8');
const json = JSON.parse(ts.slice(ts.indexOf('{'), ts.indexOf('};') + 1).replace(/,\s*}$/, '}'));

const LETTER_LIST = ['0','1','2','3','4','5','6','7','8','9','A','Ă','Â','B','C','D','Đ','E','Ê','G','H','I','K','L','M','N','O','Ô','Ơ','P','Q','R','S','T','U','Ư','V','X','Y'];

const cell = (c) => {
  const paths = (json[c] || []).map((d, i) =>
    `<path d="${d}" fill="none" stroke="${['#7c3aed','#db2777','#0891b2','#ea580c'][i%4]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<div style="text-align:center"><svg viewBox="0 0 100 100" width="120" height="120" style="border:1px solid #ddd;background:#fff"><rect x="0" y="0" width="100" height="100" fill="none"/>${paths}</svg><div style="font:14px sans-serif">${c} (${(json[c]||[]).length} nét)</div></div>`;
};

const html = `<!doctype html><meta charset="utf-8"><body style="display:flex;flex-wrap:wrap;gap:8px;background:#f8fafc">${LETTER_LIST.map(cell).join('')}</body>`;
writeFileSync(new URL('./preview.html', import.meta.url), html);
console.log('Wrote scripts/preview.html — open it in a browser');
