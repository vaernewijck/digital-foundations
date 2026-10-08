// Bingo: shared by the projector (tools/bingo/) and the card maker (teach/bingo/).
// Same seed = same cards and same call order, so the two pages always agree.
// Changing the pool changes every card: printed cards then no longer match.
(() => {
  const bin8 = n => n.toString(2).padStart(8, '0');
  const hex2 = n => '0x' + n.toString(16).toUpperCase().padStart(2, '0');
  const cp = c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

  // 30 items, only the numbers need adding up; everything else is a lookup on the decoding sheet.
  // Numbers have at most three 1s and stay out of the letter range (65-122).
  const NUMS = [6, 12, 20, 42, 48, 160];
  const HEX_LETTERS = 'HKRWez';
  const BIN_LETTERS = 'BFMTYo';   // never A: A is the worked example on the sheet
  const UNICODE = [
    ['é', 'e with acute'], ['ñ', 'n with tilde'], ['ß', 'sharp s'], ['€', 'euro sign'],
    ['Ω', 'Greek capital omega'], ['π', 'Greek small pi'], ['中', 'CJK: middle'], ['❤', 'heavy black heart'],
    ['😀', 'grinning face'], ['👍', 'thumbs up'], ['🔥', 'fire'], ['🥚', 'egg'],
  ];
  // on the sheet only: never called, look-alikes so the table is a real lookup
  const DECOYS = [
    ['ç', 'c with cedilla'], ['¥', 'yen sign'], ['μ', 'Greek small mu'], ['日', 'CJK: sun, day'],
    ['😂', 'face with tears of joy'], ['🐣', 'hatching chick'],
  ];

  const TASK = { num: 'Binary → number', hex: 'Hex → letter', bin: 'Binary → letter', uni: 'Unicode → character' };
  const POOL = [
    ...NUMS.map(n => ({ id: 'n' + n, type: 'num', code: bin8(n), answer: String(n) })),
    ...[...HEX_LETTERS].map(ch => ({ id: 'c' + ch, type: 'hex', code: hex2(ch.charCodeAt(0)), answer: ch })),
    ...[...BIN_LETTERS].map(ch => ({ id: 'c' + ch, type: 'bin', code: bin8(ch.charCodeAt(0)), answer: ch })),
    ...UNICODE.map(([ch]) => ({ id: 'u' + cp(ch), type: 'uni', code: cp(ch), answer: ch, emoji: ch.codePointAt(0) >= 0x1F000 || ch === '❤' })),
  ];
  const QUOTA = { num: 2, hex: 2, bin: 2, uni: 3 };   // 3 x 3, no FREE: a FREE middle makes a line too easy

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
    for (const type in QUOTA) {
      const picks = shuffle(POOL.filter(p => p.type === type), rng);
      const chosen = picks.slice(0, QUOTA[type]);
      // every card gets at least one emoji: swap the last Unicode pick for the first emoji left over.
      // No extra random draws, so cards that already had an emoji stay exactly the same.
      if (type === 'uni' && !chosen.some(p => p.emoji)) chosen[chosen.length - 1] = picks.find(p => p.emoji);
      cells.push(...chosen);
    }
    return shuffle(cells, rng);
  }
  // every round has its own order, the cards stay the same
  const calls = (seed, round = 0) => shuffle(POOL, rngFor(seed + ':calls' + (round ? ':' + round : '')));

  // 3 rows, 3 columns, 2 diagonals
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  // projector progress, read back by the card checker (same browser only)
  const DEFAULT_SEED = 'devine';
  const KEY = seed => 'bingo:' + seed;
  function load(seed) {
    try { return { pos: -1, round: 0, ...JSON.parse(localStorage.getItem(KEY(seed)) || '{}') }; }
    catch { return { pos: -1, round: 0 }; }
  }
  function save(seed, state) { try { localStorage.setItem(KEY(seed), JSON.stringify(state)); } catch {} }
  const seedFrom = params => (params.get('seed') || '').trim() || DEFAULT_SEED;

  window.Bingo = { POOL, TASK, UNICODE, DECOYS, bin8, hex2, cp, card, calls, LINES, load, save, seedFrom, storageKey: KEY, DEFAULT_SEED };
})();
