import assert from 'node:assert';
import { generateFirstLetter, WORDS, ONSETS } from '../src/lib/syllables.ts';

const onsetsInWords = new Set(WORDS.map((w) => w.onset));

for (let i = 0; i < 500; i++) {
  const q = generateFirstLetter();

  // đúng 4 lựa chọn, không trùng
  assert.strictEqual(q.options.length, 4, 'options phải có 4 phần tử');
  assert.strictEqual(new Set(q.options).size, 4, 'options không được trùng');

  // đáp án đúng (âm đầu) nằm trong options
  assert.ok(q.options.includes(q.answer), 'answer phải có trong options');

  // answer là âm đầu của một tiếng có thật, và mọi option là âm đầu hợp lệ
  assert.ok(onsetsInWords.has(q.answer), 'answer phải là âm đầu của một tiếng trong WORDS');
  for (const o of q.options) assert.ok(ONSETS.includes(o), `option "${o}" phải thuộc ONSETS`);

  // text (tiếng để đọc) phải bắt đầu bằng âm đầu đúng
  assert.ok(q.text.startsWith(q.answer), 'text (tiếng) phải bắt đầu bằng âm đầu');

  // visual rỗng hoặc đúng 1 emoji
  assert.ok(q.visual !== undefined && q.visual.length <= 1, 'visual có tối đa 1 emoji');
}

console.log('syllables: all assertions passed');
