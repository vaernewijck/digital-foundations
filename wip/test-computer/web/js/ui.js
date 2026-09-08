/* CARDIAC web UI — panel artwork, overlays, manual & auto modes. */
(() => {
  const M = window.CardiacMachine;
  const PROGRAMS = window.CARDIAC_PROGRAMS;
  const TEAL = '#0a9bba';

  /* ════════════════ state ════════════════ */
  const state = {
    machine: M.makeMachine(),
    slider: { op: 0, a1: 0, a2: 0 },   // the three physical sliders
    mode: 'manual',
    running: false,
    timer: null,
    presetKey: '',
  };

  const $ = (sel) => document.querySelector(sel);

  /* ════════════════ computation panel artwork ════════════════
     One coordinate table drives both the SVG art and the HTML overlays. */
  const VB = { w: 460, h: 620 };
  const CO = {
    logo:     { x: 148, y: 16,  w: 300, h: 75.7 },
    copy:     { x: 448, y: 106 },
    decLabel: { x: 291, y: 126 },
    decoder:  { x: 130, y: 131, w: 322, h: 37 },
    adv:      { x: 128, y: 235, w: 102, h: 28 },
    bug00:    { x: 240, y: 235, w: 104, h: 28 },
    stop:     { cx: 398, cy: 249, r: 24 },
    accTestL: { x: 252, y: 346 },
    accTest:  { x: 196, y: 351, w: 104, h: 27 },
    ir:       { x: 322, y: 322, w: 118, h: 126 },
    irWin:    { x: 334, y: 355, w: 94,  h: 30 },
    moveBug:  { x: 196, y: 400, w: 104, h: 38 },
    acc:      { x: 24,  y: 330, w: 168, h: 0 },   // cell size below
    accCell: 32,
    accLabel: { x: 24, y: 448 },
    input:    { x: 26,  y: 470, w: 122, h: 132 },
  };

  function svgEl(name, attrs, text) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (text != null) el.textContent = text;
    return el;
  }

  function arrowUpPath(cx, yBase, yTip, w) {
    const hw = w / 2, headW = w * 1.05, headH = w * 1.15;
    const yH = yTip + headH;
    return `M${cx - hw} ${yBase} L${cx - hw} ${yH} L${cx - headW} ${yH} L${cx} ${yTip} L${cx + headW} ${yH} L${cx + hw} ${yH} L${cx + hw} ${yBase} Z`;
  }
  function arrowLeftPath(xBase, xTip, cy, w) {
    const hw = w / 2, headW = w * 1.05, headH = w * 1.15;
    const xH = xTip + headH;
    return `M${xBase} ${cy - hw} L${xH} ${cy - hw} L${xH} ${cy - headW} L${xTip} ${cy} L${xH} ${cy + headW} L${xH} ${cy + hw} L${xBase} ${cy + hw} Z`;
  }
  function arrowRightPath(xBase, xTip, cy, w) {
    const hw = w / 2, headW = w * 1.05, headH = w * 1.15;
    const xH = xTip - headH;
    return `M${xBase} ${cy - hw} L${xH} ${cy - hw} L${xH} ${cy - headW} L${xTip} ${cy} L${xH} ${cy + headW} L${xH} ${cy + hw} L${xBase} ${cy + hw} Z`;
  }
  function outlineArrowRight(x, y, w, h) {
    const tip = h * 0.55;
    return `M${x} ${y} L${x + w - tip} ${y} L${x + w} ${y + h / 2} L${x + w - tip} ${y + h} L${x} ${y + h} Z`;
  }
  function octagonPath(cx, cy, r) {
    const k = r * 0.4142;
    return `M${cx - k} ${cy - r} L${cx + k} ${cy - r} L${cx + r} ${cy - k} L${cx + r} ${cy + k} L${cx + k} ${cy + r} L${cx - k} ${cy + r} L${cx - r} ${cy + k} L${cx - r} ${cy - k} Z`;
  }

  function buildCompArt() {
    const art = $('#compArt');
    const gShapes = svgEl('g', {});
    const gLabels = svgEl('g', {});
    art.appendChild(gShapes);
    art.appendChild(gLabels);
    const add = (el) => gShapes.appendChild(el);
    const label = (x, y, txt, size, anchor = 'middle', cls = 'art-label', spacing) => {
      const t = svgEl('text', { x, y, 'text-anchor': anchor, 'font-size': size, class: cls }, txt);
      if (spacing) t.setAttribute('letter-spacing', spacing);
      gLabels.appendChild(t);
    };

    // dot-matrix logo + credits
    add(svgEl('image', { href: 'assets/logo-cardiac.svg', x: CO.logo.x, y: CO.logo.y, width: CO.logo.w, height: CO.logo.h }));
    label(CO.copy.x, CO.copy.y, 'Copyright © 1966, 1968 Bell Telephone Laboratories, Incorporated', 7.5, 'end', 'art-fine');
    label(448, 606, '"cardiac" developed by David Hagelbarger', 8, 'end', 'art-fine');

    // instruction decoder
    label(CO.decLabel.x, CO.decLabel.y, 'INSTRUCTION DECODER', 11);

    // halt path: outline arrows + STOP
    const oa = { fill: '#f4fcfd', stroke: TEAL, 'stroke-width': 1.7 };
    add(svgEl('path', { d: outlineArrowRight(CO.adv.x, CO.adv.y, CO.adv.w, CO.adv.h), ...oa }));
    label(CO.adv.x + CO.adv.w * 0.44, CO.adv.y + 18, 'ADVANCE CARD.', 9);
    add(svgEl('path', { d: outlineArrowRight(CO.bug00.x, CO.bug00.y, CO.bug00.w, CO.bug00.h), ...oa }));
    label(CO.bug00.x + CO.bug00.w * 0.44, CO.bug00.y + 18, 'BUG TO CELL 00.', 9);
    add(svgEl('path', { d: octagonPath(CO.stop.cx, CO.stop.cy, CO.stop.r), ...oa }));
    label(CO.stop.cx, CO.stop.cy + 3.5, 'S T O P', 8.5);

    // fat arrows of the cycle
    const solid = { fill: TEAL };
    // accumulator test → instruction decoder (the big riser)
    add(svgEl('path', { d: arrowUpPath(264, 349, 174, 15), ...solid }));
    // accumulator test → advance card (halt path riser)
    add(svgEl('path', { d: arrowUpPath(206, 351, 269, 12), ...solid }));
    // move bug → accumulator test
    add(svgEl('path', { d: arrowUpPath(218, 399, 383, 12), ...solid }));
    // instruction register → move bug
    add(svgEl('path', { d: arrowLeftPath(322, 302, 419, 12), ...solid }));
    // accumulator test → instruction register
    add(svgEl('path', { d: arrowRightPath(300, 321, 364, 12), ...solid }));
    // decoder → instruction register: the big C sweep on the right
    add(svgEl('path', {
      d: `M444 172 L458 172 L458 371 L444 371 Z`, ...solid }));
    add(svgEl('path', { d: arrowLeftPath(458, 441, 364, 12), ...solid }));
    // start arrow
    add(svgEl('path', { d: arrowUpPath(405, 484, 450, 12), ...solid }));
    label(352, 478, 'S T A R T', 10);

    // instruction register box
    add(svgEl('rect', { x: CO.ir.x, y: CO.ir.y, width: CO.ir.w, height: CO.ir.h, rx: 4, fill: '#f4fcfd', stroke: TEAL, 'stroke-width': 2 }));
    label(CO.ir.x + CO.ir.w / 2, CO.ir.y + 15, 'INSTRUCTION', 10);
    label(CO.ir.x + CO.ir.w / 2, CO.ir.y + 27, 'REGISTER', 10);
    const slideTxt = ['MOVE SLIDES TO', 'AGREE WITH', 'CONTENTS OF THE', "BUG'S CELL."];
    slideTxt.forEach((t, i) => label(CO.ir.x + 9, CO.ir.y + 76 + i * 11.5, t, 8.5, 'start', 'art-small'));

    // move bug box
    add(svgEl('rect', { x: CO.moveBug.x, y: CO.moveBug.y, width: CO.moveBug.w, height: CO.moveBug.h, fill: '#f4fcfd', stroke: TEAL, 'stroke-width': 1.7 }));
    label(CO.moveBug.x + CO.moveBug.w / 2, CO.moveBug.y + 16, 'MOVE BUG AHEAD', 9);
    label(CO.moveBug.x + CO.moveBug.w / 2, CO.moveBug.y + 28, 'ONE CELL.', 9);

    // accumulator test label
    label(CO.accTestL.x, CO.accTestL.y, 'ACCUMULATOR TEST', 10);

    // accumulator label
    label(CO.accLabel.x + 2, CO.accLabel.y, 'A C C U M U L A T O R', 11, 'start');
  }

  function pct(v, total) { return (v / total * 100).toFixed(3) + '%'; }
  function placeOverlay(el, box) {
    el.style.left = pct(box.x, VB.w);
    el.style.top = pct(box.y, VB.h);
    el.style.width = pct(box.w, VB.w);
    el.style.height = pct(box.h, VB.h);
  }

  /* ════════════════ decoder sentences ════════════════ */
  const SENTENCES = [
    'COPY INPUT CARD INTO CELL {a}{b} · ADVANCE CARD',
    'ERASE ACCUMULATOR · COPY CONTENTS OF CELL {a}{b} INTO ACCUMULATOR',
    'ADD CONTENTS OF CELL {a}{b} INTO ACCUMULATOR',
    'IF MINUS — MOVE BUG TO CELL {a}{b}',
    'SHIFT ACCUMULATOR LEFT {a} PLACES… THEN {b} RIGHT',
    'COPY CONTENTS OF CELL {a}{b} ON OUTPUT CARD · ADVANCE CARD',
    'COPY ACCUMULATOR INTO CELL {a}{b}',
    'SUBTRACT CONTENTS OF CELL {a}{b} FROM ACCUMULATOR',
    "WRITE BUG'S CELL NO. IN CELL 99 · MOVE BUG TO CELL {a}{b}",
    'STOP · ADVANCE CARD · MOVE BUG TO CELL {a}{b}',
  ];

  function buildDecoder() {
    const strip = $('#decoderStrip');
    strip.innerHTML = '';
    SENTENCES.forEach((s) => {
      const line = document.createElement('div');
      line.className = 'decoder-line';
      line.innerHTML = '<span class="txt">' + s
        .replace('{a}', '<span class="dg" data-d="a"></span>')
        .replace('{b}', '<span class="dg" data-d="b"></span>') + '</span>';
      strip.appendChild(line);
    });
  }

  /* ════════════════ digit slider windows ════════════════ */
  function buildDigitStrips() {
    for (const id of ['stripOp', 'stripA1', 'stripA2']) {
      const strip = document.getElementById(id);
      strip.innerHTML = '';
      for (let d = 0; d <= 9; d++) {
        const c = document.createElement('div');
        c.className = 'digit-cell';
        c.textContent = d;
        strip.appendChild(c);
      }
    }
  }

  const SLIDER_KEYS = { stripOp: 'op', stripA1: 'a1', stripA2: 'a2' };

  function bindDigitWindows() {
    document.querySelectorAll('.digit-window').forEach((win) => {
      const key = SLIDER_KEYS[win.firstElementChild.id];
      const bump = (delta) => {
        if (state.mode === 'auto') return;
        state.slider[key] = (state.slider[key] + delta + 10) % 10;
        renderSliders();
      };
      win.addEventListener('click', (e) => {
        const r = win.getBoundingClientRect();
        bump(e.clientY < r.top + r.height / 2 ? -1 : 1);
      });
      win.addEventListener('wheel', (e) => {
        e.preventDefault();
        bump(e.deltaY > 0 ? 1 : -1);
      }, { passive: false });
    });
  }

  /* ════════════════ card strips ════════════════ */
  function buildStrip(mount, kind) {
    mount.innerHTML = `
      <div class="cardstrip">
        <div class="cardstrip-head">${kind === 'input' ? 'I N P U T' : 'O U T P U T'}
          <span class="adv-btns">
            <button class="adv adv-back" title="pull strip back">⇑</button>
            <button class="adv adv-fwd" title="advance card">⇓</button>
          </span>
        </div>
        <div class="strip-window">
          <div class="strip-cards"></div>
          <div class="slot-line"></div>
        </div>
      </div>`;
    const cardsEl = mount.querySelector('.strip-cards');
    for (let i = 0; i < M.CARDS; i++) {
      const card = document.createElement('div');
      card.className = 'pcard';
      card.innerHTML = `<span class="cno">${i + 1}</span><input maxlength="4" spellcheck="false">`;
      const inp = card.querySelector('input');
      if (kind === 'output') inp.readOnly = true;
      inp.addEventListener('change', () => {
        const v = M.parseWord(inp.value);
        if (v === undefined) { renderCards(); return; }
        state.machine[kind][i] = v;
        renderCards();
      });
      cardsEl.appendChild(card);
    }
    mount.querySelector('.adv-fwd').addEventListener('click', () => {
      const k = kind === 'input' ? 'inIdx' : 'outIdx';
      if (state.machine[k] < M.CARDS - 1) { state.machine[k]++; renderCards(); }
    });
    mount.querySelector('.adv-back').addEventListener('click', () => {
      const k = kind === 'input' ? 'inIdx' : 'outIdx';
      if (state.machine[k] > 0) { state.machine[k]--; renderCards(); }
    });
  }

  /* ════════════════ memory grid ════════════════ */
  function buildMemGrid() {
    const grid = $('#memGrid');
    grid.innerHTML = '';
    for (let col = 0; col < 6; col++) {
      const colEl = document.createElement('div');
      colEl.className = 'mem-col';
      colEl.innerHTML = `<div class="mem-col-head"><span>CELL<br>NO.</span><span>CONTENTS</span></div>`;
      const start = col * 17;
      const count = col === 5 ? 15 : 17;
      for (let i = 0; i < count; i++) {
        const n = start + i;
        const cell = document.createElement('div');
        cell.className = 'mem-cell' + (n === 0 ? ' is-fixed' : '');
        cell.dataset.cell = n;
        cell.innerHTML = `<span class="cno" title="put the bug here">${String(n).padStart(2, '0')}</span>
          <span class="pmark" title="put the bug here"></span><input maxlength="4" spellcheck="false"${n === 99 ? ' placeholder="8__"' : ''}>`;
        const inp = cell.querySelector('input');
        if (n === 0) inp.readOnly = true;
        inp.addEventListener('change', () => {
          const v = M.parseWord(inp.value);
          if (v === undefined) { renderMem(); return; }
          if (n !== 0) state.machine.mem[n] = v;
          renderMem();
        });
        const setBug = () => {
          state.machine.bug = n;
          if (state.machine.halted) { state.machine.halted = false; state.machine.haltReason = null; }
          stopRun();
          renderBug(); renderStatus(); renderMem();
        };
        cell.querySelector('.cno').addEventListener('click', setBug);
        cell.querySelector('.pmark').addEventListener('click', setBug);
        colEl.appendChild(cell);
      }
      grid.appendChild(colEl);
    }
  }

  /* ════════════════ op code table ════════════════ */
  function buildOpTable() {
    const tb = $('#opcodeTable tbody');
    tb.innerHTML = '';
    for (const op of M.OPS) {
      const tr = document.createElement('tr');
      tr.dataset.op = op.code;
      tr.innerHTML = `<td>${op.code}</td><td>${op.abbr}</td><td>${op.name}</td>`;
      tb.appendChild(tr);
    }
  }

  /* ════════════════ rendering ════════════════ */
  function fmtIn(v) { return v === null ? '' : M.fmtWord(v); }

  function renderMem() {
    document.querySelectorAll('.mem-cell').forEach((cell) => {
      const n = +cell.dataset.cell;
      const inp = cell.querySelector('input');
      if (document.activeElement !== inp) inp.value = fmtIn(state.machine.mem[n]);
      cell.classList.toggle('is-bug', n === state.machine.bug);
    });
  }

  function renderAcc() {
    const m = state.machine;
    const digits = String(m.acc).padStart(4, '0');
    ['accD0', 'accD1', 'accD2', 'accD3'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (document.activeElement !== el) el.value = digits[i];
    });
    const sign = $('#accSign');
    sign.textContent = m.accNeg ? '−' : '+';
    sign.classList.toggle('neg', m.accNeg);
  }

  function setStripTransform(stripId, idx, cellVar) {
    const strip = document.getElementById(stripId);
    const h = parseFloat(getComputedStyle(strip.parentElement).height);
    strip.style.transform = `translateY(${-idx * h}px)`;
    strip.querySelectorAll(':scope > *').forEach((c) => { c.style.height = h + 'px'; });
  }

  function renderSliders() {
    const { op, a1, a2 } = state.slider;
    setStripTransform('stripOp', op);
    setStripTransform('stripA1', a1);
    setStripTransform('stripA2', a2);
    // decoder strip
    const win = $('#ovDecoder');
    const h = win.clientHeight;
    const strip = $('#decoderStrip');
    strip.querySelectorAll('.decoder-line').forEach((l) => { l.style.height = h + 'px'; });
    strip.style.transform = `translateY(${-op * h}px)`;
    strip.querySelectorAll('[data-d="a"]').forEach((s) => { s.textContent = a1; });
    strip.querySelectorAll('[data-d="b"]').forEach((s) => { s.textContent = a2; });
    // accumulator test window
    const jump = op === 3 && state.machine.accNeg;
    $('#accArrowJump').classList.toggle('show', jump);
    $('#accArrowPass').classList.toggle('show', !jump);
    // live opcode row
    document.querySelectorAll('#opcodeTable tr').forEach((tr) => {
      tr.classList.toggle('is-live', +tr.dataset.op === op);
    });
  }

  function renderCards() {
    const m = state.machine;
    [['#ovInput', 'input', m.inIdx], ['#outputStripMount', 'output', m.outIdx]].forEach(([sel, kind, idx]) => {
      const mount = $(sel);
      const win = mount.querySelector('.strip-window');
      const cardsEl = mount.querySelector('.strip-cards');
      const cardH = Math.max(34, Math.min(52, win.clientWidth * 0.42));
      cardsEl.style.setProperty('--card-h', cardH + 'px');
      win.style.setProperty('--card-h', cardH + 'px');
      const cards = cardsEl.querySelectorAll('.pcard');
      cards.forEach((card, i) => {
        const inp = card.querySelector('input');
        if (document.activeElement !== inp) inp.value = fmtIn(m[kind][i]);
        card.classList.toggle('is-current', i === idx);
        card.classList.toggle('is-done', i < idx);
        card.classList.toggle('machine-written', kind === 'output' && m[kind][i] !== null);
      });
      const y = 7 - idx * (cardH + 4);
      cardsEl.style.transform = `translateY(${y}px)`;
    });
  }

  function renderBug() {
    const bug = $('#bugMarker');
    const cell = document.querySelector(`.mem-cell[data-cell="${state.machine.bug}"]`);
    if (!cell) return;
    const mark = cell.querySelector('.pmark');
    const main = $('.mem-main');
    const mr = main.getBoundingClientRect();
    const cr = mark.getBoundingClientRect();
    const x = cr.left - mr.left + cr.width / 2 - bug.offsetWidth / 2;
    const y = cr.top - mr.top + cr.height / 2 - bug.offsetHeight / 2;
    bug.style.transform = `translate(${x}px, ${y}px)`;
  }

  function renderStatus(msg) {
    const el = $('#status');
    const m = state.machine;
    if (msg) { el.textContent = msg; el.classList.remove('is-halt'); return; }
    if (m.halted) {
      const reasons = {
        'hrs': `HALT — program done. Bug reset to cell ${String(m.bug).padStart(2, '0')}.`,
        'blank-card': 'HALT — read a blank input card (end of the deck).',
        'blank-cell': `HALT — cell ${String(m.bug).padStart(2, '0')} is blank; nothing to execute.`,
        'output-full': 'HALT — the output strip is full.',
      };
      el.textContent = reasons[m.haltReason] || 'HALT.';
      el.classList.add('is-halt');
    } else {
      el.textContent = state.mode === 'manual'
        ? 'Manual: you are the control unit.'
        : (state.running ? 'Running…' : 'Auto: Step or Run.');
      el.classList.remove('is-halt');
    }
  }

  function renderAll() {
    renderMem(); renderAcc(); renderSliders(); renderCards(); renderBug(); renderStatus();
  }

  /* ════════════════ auto mode execution ════════════════ */
  function flashCell(n) {
    const cell = document.querySelector(`.mem-cell[data-cell="${n}"]`);
    if (!cell) return;
    cell.classList.remove('flash');
    void cell.offsetWidth;
    cell.classList.add('flash');
  }

  function doStep() {
    const m = state.machine;
    if (m.halted) { renderStatus(); stopRun(); return; }
    const ev = M.step(m);
    if (!ev) return;
    if (ev.error) { renderAll(); stopRun(); return; }

    state.slider = { op: ev.op, a1: Math.floor(ev.addr / 10), a2: ev.addr % 10 };

    // scratch rows illustrate ADD/SUB the way you'd pencil them
    const scr = document.querySelectorAll('.acc-scratch');
    if (ev.op === 2 || ev.op === 7) {
      scr[2].value = M.fmtWord(ev.accBefore, { sign: true });
      scr[5].value = (ev.op === 7 ? '−' : '+') + M.fmtWord(Math.abs(ev.operand)).replace('−', '');
    } else if (ev.op === 1) {
      scr.forEach((s) => { s.value = ''; });
    }

    renderAll();
    ev.writes.forEach((w) => flashCell(w.cell));
    if (m.halted) stopRun();
  }

  function stopRun() {
    state.running = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    $('#btnRun').textContent = 'Run';
    renderStatus();
  }

  function toggleRun() {
    if (state.running) { stopRun(); return; }
    if (state.machine.halted) return;
    state.running = true;
    $('#btnRun').textContent = 'Pause';
    renderStatus();
    const tick = () => {
      if (!state.running) return;
      doStep();
    };
    state.timer = setInterval(tick, +$('#speedRange').value);
    tick();
  }

  /* ════════════════ programs ════════════════ */
  function loadPreset(key) {
    stopRun();
    state.presetKey = key;
    const m = M.makeMachine();
    const p = key ? PROGRAMS[key] : null;
    if (p) {
      for (const a in p.mem) m.mem[+a] = p.mem[a];
      p.input.forEach((v, i) => { m.input[i] = v; });
      m.bug = p.bug;
    }
    state.machine = m;
    state.slider = wordToSlider(m.mem[m.bug]);
    document.querySelectorAll('.acc-scratch').forEach((s) => { s.value = ''; });
    $('#programTitle').textContent = p ? p.title : 'Current program';
    $('#programSource').textContent = p ? `From the 1968 manual — ${p.source}` : '';
    $('#programNotes').textContent = p ? p.notes.replace(/\n/g, ' ') : $('#programNotes').dataset.default;
    renderAll();
  }

  function wordToSlider(word) {
    const w = Math.abs(word ?? 0);
    return { op: Math.floor(w / 100), a1: Math.floor((w % 100) / 10), a2: w % 10 };
  }

  /* ════════════════ mode & controls ════════════════ */
  function setMode(mode) {
    state.mode = mode;
    stopRun();
    document.body.classList.toggle('mode-auto', mode === 'auto');
    document.body.classList.toggle('mode-manual', mode === 'manual');
    $('#modeManual').classList.toggle('is-active', mode === 'manual');
    $('#modeAuto').classList.toggle('is-active', mode === 'auto');
    const auto = mode === 'auto';
    ['accD0', 'accD1', 'accD2', 'accD3'].forEach((id) => { document.getElementById(id).readOnly = auto; });
    document.querySelectorAll('.acc-scratch').forEach((s) => { s.readOnly = auto; });
    renderStatus();
  }

  function bindControls() {
    $('#modeManual').addEventListener('click', () => setMode('manual'));
    $('#modeAuto').addEventListener('click', () => setMode('auto'));
    $('#btnStep').addEventListener('click', () => { if (state.mode === 'auto') doStep(); });
    $('#btnRun').addEventListener('click', () => { if (state.mode === 'auto') toggleRun(); });
    $('#speedRange').addEventListener('input', () => {
      if (state.running) { clearInterval(state.timer); state.timer = setInterval(doStep, +$('#speedRange').value); }
    });
    $('#btnReset').addEventListener('click', () => loadPreset(state.presetKey));
    $('#btnClear').addEventListener('click', () => { $('#presetSelect').value = ''; loadPreset(''); });
    $('#presetSelect').addEventListener('change', (e) => loadPreset(e.target.value));

    // accumulator manual editing
    $('#accSign').addEventListener('click', () => {
      if (state.mode === 'auto') return;
      state.machine.accNeg = !state.machine.accNeg;
      renderAcc(); renderSliders();
    });
    ['accD0', 'accD1', 'accD2', 'accD3'].forEach((id, i) => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => {
        el.value = el.value.replace(/\D/g, '').slice(-1);
        const ds = ['accD0', 'accD1', 'accD2', 'accD3'].map((d) => +document.getElementById(d).value || 0);
        state.machine.acc = ds[0] * 1000 + ds[1] * 100 + ds[2] * 10 + ds[3];
        if (el.value && i < 3) document.getElementById(['accD0', 'accD1', 'accD2', 'accD3'][i + 1]).select();
      });
    });
  }

  /* ════════════════ init ════════════════ */
  function init() {
    // ladybug artwork
    $('#bugArtMount').innerHTML = window.LADYBUG_ART;

    buildCompArt();
    buildDecoder();
    buildDigitStrips();
    bindDigitWindows();
    buildMemGrid();
    buildOpTable();
    buildStrip($('#ovInput'), 'input');
    buildStrip($('#outputStripMount'), 'output');

    placeOverlay($('#ovDecoder'), CO.decoder);
    placeOverlay($('#ovAccTest'), CO.accTest);
    placeOverlay($('#ovIr'), CO.irWin);
    placeOverlay($('#ovAcc'), { x: CO.acc.x, y: CO.acc.y, w: CO.acc.w, h: CO.accCell * 3 });
    placeOverlay($('#ovInput'), CO.input);

    const sel = $('#presetSelect');
    for (const key in PROGRAMS) {
      const o = document.createElement('option');
      o.value = key;
      o.textContent = PROGRAMS[key].title;
      sel.appendChild(o);
    }

    $('#programNotes').dataset.default = $('#programNotes').textContent;

    bindControls();
    setMode('manual');
    loadPreset('');

    window.addEventListener('resize', () => { renderSliders(); renderCards(); renderBug(); });
    // fonts load late → re-measure
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderAll);
    setTimeout(renderAll, 60);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
