// -------------------------
// Paramètres & état global
// -------------------------
let params = {
  cols: 12,
  rows: 12,
  paddingPct: 12,
  emptyProb: 0.25,
  bgColor: '#0a0a0a',
  palette: ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec'],
};

let bgImg = null;     // image de fond (p5.Image)
let dirty = true;     // si true => redraw()

// -------------------------
// Utilitaires
// -------------------------
function drawImageCover(img, w, h) {
  const iw = img.width, ih = img.height;
  const scale = Math.max(w / iw, h / ih);
  const nw = iw * scale, nh = ih * scale;
  const x = (w - nw) / 2;
  const y = (h - nh) / 2;
  image(img, x, y, nw, nh);
}

function normalizeHexList(list) {
  const out = [];
  list.forEach(col => {
    if (!col) return;
    let v = col.trim();
    if (!v) return;
    if (!v.startsWith('#')) v = '#' + v;
    if (v.length === 4) {
      v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    }
    if (/^#([0-9a-f]{6})$/i.test(v)) out.push(v.toLowerCase());
  });
  return [...new Set(out)];
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function drawOrientedTriangle(cx, cy, s, orientationDeg) {
  const r = s / 2;
  const o = (orientationDeg % 360 + 360) % 360;
  let p1, p2, p3;
  if (o === 0) {
    p1 = [cx, cy - r]; p2 = [cx - r, cy + r]; p3 = [cx + r, cy + r];
  } else if (o === 90) {
    p1 = [cx + r, cy]; p2 = [cx - r, cy - r]; p3 = [cx - r, cy + r];
  } else if (o === 180) {
    p1 = [cx, cy + r]; p2 = [cx - r, cy - r]; p3 = [cx + r, cy - r];
  } else {
    p1 = [cx - r, cy]; p2 = [cx + r, cy - r]; p3 = [cx + r, cy + r];
  }
  triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
}

function drawSemiCircle(cx, cy, s, orientationDeg) {
  const start = radians(orientationDeg);
  arc(cx, cy, s, s, start, start + PI, PIE);
}

// -------------------------
// p5.js — setup/draw
// -------------------------
function setup() {
  pixelDensity(2);
  createCanvas(windowWidth, windowHeight);
  noLoop();
  buildGUI();
  randomSeed(Math.floor(Math.random() * 1e9));
  noiseSeed(Math.floor(Math.random() * 1e9));
  dirty = true;
  redraw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  dirty = true;
  redraw();
}

function draw() {
  if (!dirty) return;
  clear();

  if (bgImg) {
    drawImageCover(bgImg, width, height);
  } else {
    background(params.bgColor);
  }

  const cols = Math.max(1, Math.floor(params.cols));
  const rows = Math.max(1, Math.floor(params.rows));
  const cellW = width / cols;
  const cellH = height / rows;
  const cellS = Math.min(cellW, cellH);
  const pad = (params.paddingPct / 100) * cellS;
  const shapeS = Math.max(0, cellS - pad * 2);

  noStroke();

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      if (Math.random() < params.emptyProb) continue;
      const cx = gx * cellW + cellW / 2;
      const cy = gy * cellH + cellH / 2;
      if (params.palette.length === 0) continue;
      fill(randomChoice(params.palette));
      const shape = randomChoice(['circle', 'semicircle', 'triangle', 'square']);
      const orientations = [0, 90, 180, 270];
      const ori = randomChoice(orientations);

      if (shape === 'circle') ellipse(cx, cy, shapeS, shapeS);
      else if (shape === 'square') { rectMode(CENTER); rect(cx, cy, shapeS, shapeS, 2); }
      else if (shape === 'triangle') drawOrientedTriangle(cx, cy, shapeS, ori);
      else if (shape === 'semicircle') drawSemiCircle(cx, cy, shapeS, ori);
    }
  }
  dirty = false;
}

// -------------------------
// GUI — construction
// -------------------------
function buildGUI() {
  const colsEl = document.getElementById('cols');
  const rowsEl = document.getElementById('rows');
  const paddingEl = document.getElementById('padding');
  const paddingVal = document.getElementById('paddingVal');
  const emptyEl = document.getElementById('emptyProb');
  const emptyVal = document.getElementById('emptyVal');
  const bgColorEl = document.getElementById('bgColor');
  const bgImgEl = document.getElementById('bgImg');

  const paletteChips = document.getElementById('paletteChips');
  const paletteInput = document.getElementById('paletteInput');
  const applyPaletteBtn = document.getElementById('applyPalette');
  const addColorBtn = document.getElementById('addColor');
  const colorPicker = document.getElementById('colorPicker');
  const shufflePaletteBtn = document.getElementById('shufflePalette');
  const clearPaletteBtn = document.getElementById('clearPalette');

  const regenBtn = document.getElementById('regen');
  const downloadBtn = document.getElementById('download');

  colsEl.value = params.cols;
  rowsEl.value = params.rows;
  paddingEl.value = params.paddingPct;
  paddingVal.textContent = params.paddingPct + '%';
  emptyEl.value = params.emptyProb;
  emptyVal.textContent = Math.round(params.emptyProb * 100) + '%';
  bgColorEl.value = params.bgColor;
  renderPaletteChips();

  colsEl.addEventListener('input', () => { params.cols = Number(colsEl.value); triggerRedraw(); });
  rowsEl.addEventListener('input', () => { params.rows = Number(rowsEl.value); triggerRedraw(); });
  paddingEl.addEventListener('input', () => { params.paddingPct = Number(paddingEl.value); paddingVal.textContent = params.paddingPct + '%'; triggerRedraw(); });
  emptyEl.addEventListener('input', () => { params.emptyProb = Number(emptyEl.value); emptyVal.textContent = Math.round(params.emptyProb * 100) + '%'; triggerRedraw(); });
  bgColorEl.addEventListener('input', () => { params.bgColor = bgColorEl.value; triggerRedraw(); });

  bgImgEl.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    loadImage(url, (img) => { bgImg = img; triggerRedraw(); setTimeout(() => URL.revokeObjectURL(url), 1000); },
      (err) => { console.error('Échec du chargement', err); bgImg = null; triggerRedraw(); });
  });

  applyPaletteBtn.addEventListener('click', () => {
    const parts = (paletteInput.value || '').split(',');
    const list = normalizeHexList(parts);
    if (list.length) { params.palette = list; renderPaletteChips(); triggerRedraw(); }
  });

  addColorBtn.addEventListener('click', () => {
    const c = colorPicker.value;
    const list = normalizeHexList([c]);
    if (list.length) { params.palette.push(list[0]); params.palette = [...new Set(params.palette)]; renderPaletteChips(); triggerRedraw(); }
  });

  shufflePaletteBtn.addEventListener('click', () => {
    params.palette = shuffleArray(params.palette.slice());
    renderPaletteChips(); triggerRedraw();
  });

  clearPaletteBtn.addEventListener('click', () => {
    params.palette = []; renderPaletteChips(); triggerRedraw();
  });

  regenBtn.addEventListener('click', () => {
    randomSeed(Math.floor(Math.random() * 1e9));
    dirty = true; redraw();
  });

  downloadBtn.addEventListener('click', () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveCanvas('composition-' + stamp, 'png');
  });

  function renderPaletteChips() {
    paletteChips.innerHTML = '';
    params.palette.forEach((c, idx) => {
      const chip = document.createElement('span');
      chip.className = 'chip'; chip.title = 'Cliquer pour retirer';
      const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = c;
      const label = document.createElement('span'); label.textContent = c;
      chip.appendChild(sw); chip.appendChild(label);
      chip.addEventListener('click', () => { params.palette.splice(idx, 1); renderPaletteChips(); triggerRedraw(); });
      paletteChips.appendChild(chip);
    });
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function triggerRedraw() { dirty = true; redraw(); }
}
