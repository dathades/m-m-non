import { readFileSync } from 'node:fs';
const t = readFileSync('src/lib/viSyllables.ts', 'utf8');
const arr = JSON.parse(t.slice(t.indexOf('['), t.lastIndexOf(']') + 1));
const s = new Set(arr);
console.log('count', arr.length);
console.log('first300 all NFC:', arr.slice(0, 300).every(x => x === x.normalize('NFC')));
const keys = ['cá','gà','bò','voi','sữa','ngựa','chuối','bướm','khỉ','quà','ca','ga'];
console.log('membership:', keys.map(k => k + '=' + s.has(k)).join(' '));
