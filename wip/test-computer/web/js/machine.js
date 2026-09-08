/* CARDIAC machine model — semantics from the 1968 Bell Labs manual.
   Pure state + step(); no DOM. Words are signed 3-digit integers (-999..999),
   blank cells/cards are null. Cell 00 is hardwired to +001. Zero is positive. */

const CARDS = 25;

const OPS = [
  { code: 0, abbr: 'INP', name: 'Input' },
  { code: 1, abbr: 'CLA', name: 'Clear and add' },
  { code: 2, abbr: 'ADD', name: 'Add' },
  { code: 3, abbr: 'TAC', name: 'Test accumulator contents' },
  { code: 4, abbr: 'SFT', name: 'Shift' },
  { code: 5, abbr: 'OUT', name: 'Output' },
  { code: 6, abbr: 'STO', name: 'Store' },
  { code: 7, abbr: 'SUB', name: 'Subtract' },
  { code: 8, abbr: 'JMP', name: 'Jump' },
  { code: 9, abbr: 'HRS', name: 'Halt and reset' },
];

function makeMachine() {
  return {
    mem: Array.from({ length: 100 }, (_, i) => (i === 0 ? 1 : null)),
    acc: 0,
    accNeg: false,          // sign slider; kept separate so −000 can exist on paper
    bug: 0,                 // program counter (the ladybug's cell)
    input: Array(CARDS).fill(null),
    output: Array(CARDS).fill(null),
    inIdx: 0,
    outIdx: 0,
    halted: false,
    haltReason: null,       // 'hrs' | 'blank-card' | 'blank-cell' | 'output-full'
  };
}

function accValue(m) {
  return m.accNeg ? -m.acc : m.acc;
}

function setAcc(m, v) {
  m.accNeg = v < 0;
  m.acc = Math.abs(v) % 10000;   // 4 digits; anything beyond the overflow square is lost
}

/* Execute one fetch–advance–execute cycle.
   Returns an event record the UI uses to animate, or null if halted. */
function step(m) {
  if (m.halted) return null;

  const pc = m.bug;
  const word = m.mem[pc];
  if (word === null) {
    m.halted = true;
    m.haltReason = 'blank-cell';
    return { pc, error: 'blank-cell' };
  }

  const w = Math.abs(word);
  const op = Math.floor(w / 100);
  const addr = w % 100;
  m.bug = (pc + 1) % 100;         // move bug ahead one cell before executing

  const ev = { pc, word: w, op, addr, writes: [], out: null, in: null, jumped: false };

  switch (op) {
    case 0: { // INP — copy input card into cell, advance card
      const card = m.inIdx < CARDS ? m.input[m.inIdx] : null;
      if (card === null) {
        m.halted = true;
        m.haltReason = 'blank-card';
        ev.haltedOnBlank = true;
        break;
      }
      ev.in = { idx: m.inIdx, value: card };
      if (addr !== 0) { m.mem[addr] = card; ev.writes.push({ cell: addr, value: card }); }
      m.inIdx += 1;
      break;
    }
    case 1: { // CLA — erase accumulator, copy cell into it
      const v = m.mem[addr] ?? 0;
      setAcc(m, v);
      ev.operand = v;
      break;
    }
    case 2: { // ADD
      const v = m.mem[addr] ?? 0;
      ev.operand = v;
      ev.accBefore = accValue(m);
      setAcc(m, accValue(m) + v);
      break;
    }
    case 3: { // TAC — jump only when the accumulator sign is minus
      if (m.accNeg) {          // the sign slider decides; zero counts as positive
        m.bug = addr;
        ev.jumped = true;
      }
      break;
    }
    case 4: { // SFT 4xy — left x places, then right y places
      const x = Math.floor(addr / 10);
      const y = addr % 10;
      let mag = m.acc;
      mag = (mag * 10 ** x) % 10000;
      mag = Math.floor(mag / 10 ** y);
      m.acc = mag;
      ev.shift = { x, y };
      break;
    }
    case 5: { // OUT — copy cell onto output card, advance card
      if (m.outIdx >= CARDS) {
        m.halted = true;
        m.haltReason = 'output-full';
        break;
      }
      const v = m.mem[addr] ?? null;
      m.output[m.outIdx] = v;
      ev.out = { idx: m.outIdx, value: v };
      m.outIdx += 1;
      break;
    }
    case 6: { // STO — accumulator's low 3 digits (with sign) into cell
      const v = (m.accNeg ? -1 : 1) * (m.acc % 1000);
      if (addr !== 0) { m.mem[addr] = v; ev.writes.push({ cell: addr, value: v }); }
      break;
    }
    case 7: { // SUB
      const v = m.mem[addr] ?? 0;
      ev.operand = v;
      ev.accBefore = accValue(m);
      setAcc(m, accValue(m) - v);
      break;
    }
    case 8: { // JMP — write 8 + return address into cell 99, jump
      const ret = 800 + m.bug;      // bug already advanced: this is the return address
      m.mem[99] = ret;
      ev.writes.push({ cell: 99, value: ret });
      m.bug = addr;
      ev.jumped = true;
      break;
    }
    case 9: { // HRS — halt, reset bug
      m.bug = addr;
      m.halted = true;
      m.haltReason = 'hrs';
      ev.jumped = true;
      break;
    }
  }
  ev.halted = m.halted;
  return ev;
}

/* Formatting helpers shared by the UI */
function fmtWord(v, { sign = false } = {}) {
  if (v === null || v === undefined) return '';
  const s = Math.abs(v).toString().padStart(3, '0');
  if (v < 0) return '−' + s;
  return (sign ? '+' : '') + s;
}

function parseWord(text) {
  if (text == null) return null;
  const t = text.replace(/[−–—]/g, '-').trim();
  if (t === '' ) return null;
  const mch = t.match(/^([+-]?)(\d{1,3})$/);
  if (!mch) return undefined;                 // invalid
  return parseInt(mch[2], 10) * (mch[1] === '-' ? -1 : 1);
}

window.CardiacMachine = { makeMachine, step, accValue, setAcc, fmtWord, parseWord, OPS, CARDS };
