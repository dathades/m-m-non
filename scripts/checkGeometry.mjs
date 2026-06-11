// Throwaway geometry checker for letterStrokes.ts
// Checks: all coords in [0,100], marks sensibly placed for composites.
import { readFileSync } from 'node:fs';

const ts = readFileSync(new URL('../src/lib/letterStrokes.ts', import.meta.url), 'utf8');
const json = JSON.parse(
  ts.slice(ts.indexOf('{'), ts.indexOf('};') + 1).replace(/,\s*}$/, '}')
);

// --- Helper: extract all (x, y) numeric coords from an SVG path d string ---
function extractCoords(d) {
  // Match sequences of numbers (including decimals, negatives)
  const nums = d.match(/-?\d+\.?\d*/g);
  if (!nums) return [];
  const coords = [];
  // Commands: M, L consume pairs; Q consumes 4 numbers (cx cy x y); C consumes 6
  // Simple approach: grab all pairs of numbers
  for (let i = 0; i + 1 < nums.length; i += 2) {
    coords.push([parseFloat(nums[i]), parseFloat(nums[i + 1])]);
  }
  return coords;
}

// Gather y-range of a set of path strings
function yRange(paths) {
  let minY = Infinity, maxY = -Infinity;
  for (const d of paths) {
    for (const [, y] of extractCoords(d)) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minY, maxY };
}

function xRange(paths) {
  let minX = Infinity, maxX = -Infinity;
  for (const d of paths) {
    for (const [x] of extractCoords(d)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  return { minX, maxX };
}

// --- 1. Check all coords in [0, 100] ---
console.log('\n=== Bounds check (all coords must be in [0, 100]) ===');
let allInBounds = true;
for (const [ch, paths] of Object.entries(json)) {
  for (let si = 0; si < paths.length; si++) {
    const coords = extractCoords(paths[si]);
    for (const [x, y] of coords) {
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        console.log(`  OUT OF BOUNDS: char=${ch} stroke[${si}] coord=(${x}, ${y})`);
        allInBounds = false;
      }
    }
  }
}
if (allInBounds) {
  console.log('  All coords in [0, 100]. PASS');
} else {
  console.log('  FAIL — some coords out of bounds (see above)');
}

// --- 2. Composite letter mark placement ---
// For each composite, the base is all strokes except the last N (mark strokes),
// and the mark is the last N strokes.
// Base letters and their mark stroke count:
const COMPOSITES = {
  'Ă': { base: 'A', markCount: 1, type: 'above' },   // breve above
  'Â': { base: 'A', markCount: 1, type: 'above' },   // circumflex above
  'Ê': { base: 'E', markCount: 1, type: 'above' },   // circumflex above
  'Ô': { base: 'O', markCount: 1, type: 'above' },   // circumflex above
  'Ơ': { base: 'O', markCount: 1, type: 'horn' },    // horn top-right
  'Ư': { base: 'U', markCount: 1, type: 'horn' },    // horn top-right
  'Đ': { base: 'D', markCount: 1, type: 'bar' },     // bar on left stem
};

console.log('\n=== Composite mark placement ===');
for (const [ch, { base, markCount, type }] of Object.entries(COMPOSITES)) {
  const paths = json[ch];
  if (!paths) { console.log(`  ${ch}: MISSING — FAIL`); continue; }

  const basePaths = paths.slice(0, paths.length - markCount);
  const markPaths = paths.slice(paths.length - markCount);

  const baseY = yRange(basePaths);
  const markY = yRange(markPaths);
  const baseX = xRange(basePaths);
  const markX = xRange(markPaths);

  if (type === 'above') {
    // Mark should be ABOVE the letter body: mark's maxY <= base's minY (allowing ~5 units overlap)
    const overlap = markY.maxY - baseY.minY;
    const status = markY.maxY <= baseY.minY + 5 ? 'PASS' : 'WARN';
    console.log(`  ${ch} [${type}]: base y=[${baseY.minY.toFixed(1)}, ${baseY.maxY.toFixed(1)}]  mark y=[${markY.minY.toFixed(1)}, ${markY.maxY.toFixed(1)}]  overlap=${overlap.toFixed(1)}  → ${status}`);
  } else if (type === 'horn') {
    // Horn should be near top-right: mark x > midpoint of base, mark minY near top of base
    const baseMidX = (baseX.minX + baseX.maxX) / 2;
    const hornRightish = markX.minX >= baseMidX;
    const hornTopish = markY.minY <= baseY.minY + 20; // within top 20% of letter height
    const status = hornRightish && hornTopish ? 'PASS' : 'WARN';
    console.log(`  ${ch} [${type}]: base x=[${baseX.minX.toFixed(1)}, ${baseX.maxX.toFixed(1)}] y=[${baseY.minY.toFixed(1)}, ${baseY.maxY.toFixed(1)}]  mark x=[${markX.minX.toFixed(1)}, ${markX.maxX.toFixed(1)}] y=[${markY.minY.toFixed(1)}, ${markY.maxY.toFixed(1)}]  right-of-mid=${hornRightish} near-top=${hornTopish}  → ${status}`);
  } else if (type === 'bar') {
    // Bar for Đ: should cross left stem (~x=26.87), mid-height of letter
    const letterMidY = (baseY.minY + baseY.maxY) / 2;
    const barOnStem = markX.minX <= 30; // starts at or left of the stem
    const barMidHeight = Math.abs((markY.minY + markY.maxY) / 2 - letterMidY) < 20;
    const status = barOnStem && barMidHeight ? 'PASS' : 'WARN';
    console.log(`  ${ch} [${type}]: base y=[${baseY.minY.toFixed(1)}, ${baseY.maxY.toFixed(1)}] mid=${letterMidY.toFixed(1)}  mark x=[${markX.minX.toFixed(1)}, ${markX.maxX.toFixed(1)}] y=[${markY.minY.toFixed(1)}, ${markY.maxY.toFixed(1)}]  on-stem=${barOnStem} mid-height=${barMidHeight}  → ${status}`);
  }
}

console.log('\nDone.');
