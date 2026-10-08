// Bingo: shared by the projector (tools/bingo/) and the card maker (teach/bingo/).
// Same seed = same cards and same call order, so the two pages always agree.
(() => {
  const bin8 = n => n.toString(2).padStart(8, '0');
  const cp = c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

  // numbers stay out of the letter range (65-122), so a code never means two things
  const NUMS = [1, 2, 3, 5, 7, 8, 10, 12, 15, 16, 21, 25, 31, 42, 50, 64, 127, 128, 200, 255];
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabeoz';
  const UNICODE = [
    ['é', 'e with acute'], ['ñ', 'n with tilde'], ['ß', 'sharp s'], ['€', 'euro sign'], ['Ω', 'Greek capital omega'],
    ['π', 'Greek small pi'], ['中', 'CJK: middle'], ['❤', 'heavy black heart'], ['😀', 'grinning face'], ['🥚', 'egg'],
  ];
  // on the reference sheet only: never called, look-alikes so the table is a real lookup
  const DECOYS = [
    ['ç', 'c with cedilla'], ['¥', 'yen sign'], ['μ', 'Greek small mu'], ['日', 'CJK: sun, day'],
    ['😂', 'face with tears of joy'], ['🐣', 'hatching chick'],
  ];

  const POOL = [
    ...NUMS.map(n => ({ id: 'n' + n, type: 'Number', code: bin8(n), answer: String(n) })),
    ...[...LETTERS].map(ch => ({ id: 'c' + ch, type: 'Letter', code: bin8(ch.charCodeAt(0)), answer: ch })),
    ...UNICODE.map(([ch]) => ({ id: 'u' + cp(ch), type: 'Unicode', code: cp(ch), answer: ch })),
  ];
  const QUOTA = { Number: 3, Letter: 3, Unicode: 3 };   // 3 x 3, no FREE: a FREE middle makes a line too easy

  // seeded random: xmur3 hash -> mulberry32
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; };
  }
  function mulberry32(a) {
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const rngFor = key => mulberry32(xmur3(key)());
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // 9 cells, row by row
  function card(seed, n) {
    const rng = rngFor(seed + ':card:' + n);
    let cells = [];
    for (const type in QUOTA) cells.push(...shuffle(POOL.filter(p => p.type === type), rng).slice(0, QUOTA[type]));
    return shuffle(cells, rng);
  }
  const calls = seed => shuffle(POOL, rngFor(seed + ':calls'));

  // 3 rows, 3 columns, 2 diagonals
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  // projector progress, read back by the card checker (same browser only)
  const DEFAULT_SEED = 'devine';
  const KEY = seed => 'bingo:' + seed;
  function load(seed) {
    try { return { pos: -1, ...JSON.parse(localStorage.getItem(KEY(seed)) || '{}') }; }
    catch { return { pos: -1 }; }
  }
  function save(seed, state) { try { localStorage.setItem(KEY(seed), JSON.stringify(state)); } catch {} }
  const seedFrom = params => (params.get('seed') || '').trim() || DEFAULT_SEED;

  window.Bingo = { POOL, LETTERS, UNICODE, DECOYS, bin8, cp, card, calls, LINES, load, save, seedFrom, storageKey: KEY, DEFAULT_SEED };
})();
