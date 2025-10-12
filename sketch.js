// -------------------------
// Paramètres & état global
// -------------------------
let params = {
  cols: 12,
  rows: 12,
  paddingPct: 12,
  emptyProb: 0.25,
  bgColor: '#0a0a0a',
  palette: ['#ffffff', '#ff0000', '#0015ff', '#20ed09', '#fbff00'],
  shapeMode: 'any',
  currentPreset: 0,
  canvasSize: 0, // Index de la taille de canvas sélectionnée
};

// Définition des tailles de canvas disponibles
let canvasSizes = [
  { name: "HD Landscape", width: 1920, height: 1080 }, // Format par défaut (non sélectionnable)
  { name: "Portrait", width: 1080, height: 1920 },
  { name: "Square", width: 1080, height: 1080 },
  { name: "4:5", width: 1080, height: 1350 }
];

// Définition des presets
let presets = [
  {
    name: "The worm",
    shape: 'circle',
    paddingPct: 9,
    emptyProb: 0.32,
    fillColor: '#63C8FF',
    bgImagePath: 'presets/01.png'
  },
  {
    name: "The gradient",
    shape: 'triangle',
    paddingPct: 4,
    emptyProb: 0.75,
    fillColor: '#afcfd9',
    bgImagePath: 'presets/02.png'
  },
  {
    name: "dithergrid",
    shape: 'square',
    paddingPct: 35,
    emptyProb: 0.6,
    fillColor: '#ffffff',
    bgImagePath: 'presets/03.png'
  },
  {
    name: "Custom",
    shape: 'any',
    paddingPct: 12,
    emptyProb: 0.25,
    fillColor: null, // Utilise la palette multicolore
    bgImagePath: null, // Utilise la couleur de fond
    isCustom: true
  }
];

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

// -------------------------
// Gestion des tailles de canvas
// -------------------------
function setCanvasSize(sizeIndex) {
  if (sizeIndex < 0 || sizeIndex >= canvasSizes.length) return;

  params.canvasSize = sizeIndex;
  const size = canvasSizes[sizeIndex];

  // Redimensionner le canvas à la taille réelle sélectionnée
  updateCanvasDisplay();
  dirty = true;
  redraw();
}

function updateCanvasDisplay() {
  const targetSize = getTargetCanvasSize();
  let canvasWidth = targetSize.width;
  let canvasHeight = targetSize.height;

  // Calculer la mise à l'échelle si le canvas est trop grand pour la fenêtre
  const maxWidth = windowWidth - 40; // Marge de 20px de chaque côté
  const maxHeight = windowHeight - 40; // Marge de 20px en haut et en bas

  const scaleX = maxWidth / canvasWidth;
  const scaleY = maxHeight / canvasHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Ne pas agrandir, seulement réduire

  if (scale < 1) {
    canvasWidth *= scale;
    canvasHeight *= scale;
  }

  resizeCanvas(canvasWidth, canvasHeight);

  // Centrer le canvas
  centerCanvas();
}

function centerCanvas() {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.position = 'fixed';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.zIndex = '1';
    canvas.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    canvas.style.border = '1px solid #333';
  }

  // Mettre à jour l'indicateur de taille
  updateCanvasSizeInfo();
}

function updateCanvasSizeInfo() {
  const canvasSizeInfo = document.getElementById('canvasSizeInfo');
  if (canvasSizeInfo) {
    const targetSize = getTargetCanvasSize();
    const actualWidth = width;
    const actualHeight = height;
    const scale = actualWidth / targetSize.width;

    if (scale < 1) {
      canvasSizeInfo.textContent = `Target: ${targetSize.width}×${targetSize.height} pixels (scaled to ${Math.round(scale * 100)}%)`;
    } else {
      canvasSizeInfo.textContent = `Current: ${targetSize.width}×${targetSize.height} pixels`;
    }
  }
}

function getTargetCanvasSize() {
  return canvasSizes[params.canvasSize];
}

// -------------------------
// Gestion des presets
// -------------------------

// Fonction pour configurer les chemins d'images des presets
function setPresetImages(imagePaths) {
  if (imagePaths && imagePaths.length >= 3) {
    presets[0].bgImagePath = imagePaths[0]; // The worm
    presets[1].bgImagePath = imagePaths[1]; // The gradient  
    presets[2].bgImagePath = imagePaths[2]; // dithergrid
  }
}

// Exemple d'utilisation (décommentez et modifiez les chemins selon vos images) :
// setPresetImages([
//   'images/preset1.jpg',
//   'images/preset2.jpg', 
//   'images/preset3.jpg'
// ]);
function applyPreset(presetIndex) {
  if (presetIndex < 0 || presetIndex >= presets.length) return;

  const preset = presets[presetIndex];
  params.currentPreset = presetIndex;
  params.shapeMode = preset.shape;
  params.paddingPct = preset.paddingPct;
  params.emptyProb = preset.emptyProb;

  // Gérer la palette selon le type de preset
  if (preset.isCustom) {
    // Pour Custom, garder la palette existante ou utiliser la palette par défaut
    if (params.palette.length === 0) {
      params.palette = ['#ffffff', '#ff0000', '#0015ff', '#20ed09', '#fbff00'];
    }
  } else {
    // Pour les autres presets, utiliser une seule couleur
    params.palette = [preset.fillColor];
  }

  // Charger l'image de fond si définie
  if (preset.bgImagePath) {
    loadImage(preset.bgImagePath, (img) => {
      bgImg = img;
      dirty = true;
      redraw();
    }, (err) => {
      console.error('Erreur lors du chargement de l\'image:', err);
      bgImg = null;
      dirty = true;
      redraw();
    });
  } else {
    bgImg = null;
  }

  // Mettre à jour l'interface
  updateGUIFromParams();
  dirty = true;
  redraw();
}

function updateGUIFromParams() {
  const colsEl = document.getElementById('cols');
  const rowsEl = document.getElementById('rows');
  const paddingEl = document.getElementById('padding');
  const paddingVal = document.getElementById('paddingVal');
  const emptyEl = document.getElementById('emptyProb');
  const emptyVal = document.getElementById('emptyVal');
  const bgColorEl = document.getElementById('bgColor');
  const shapeModeEl = document.getElementById('shapeMode');
  const presetSelectorEl = document.getElementById('presetSelector');
  const canvasSizeEl = document.getElementById('canvasSize');

  if (colsEl) colsEl.value = params.cols;
  if (rowsEl) rowsEl.value = params.rows;
  if (paddingEl) {
    paddingEl.value = params.paddingPct;
    if (paddingVal) paddingVal.textContent = params.paddingPct + '%';
  }
  if (emptyEl) {
    emptyEl.value = params.emptyProb;
    if (emptyVal) emptyVal.textContent = Math.round(params.emptyProb * 100) + '%';
  }
  if (bgColorEl) bgColorEl.value = params.bgColor;
  if (shapeModeEl) shapeModeEl.value = params.shapeMode;
  if (presetSelectorEl) presetSelectorEl.value = params.currentPreset;
  if (canvasSizeEl) canvasSizeEl.value = params.canvasSize;

  renderPaletteChips();
}

// -------------------------
// Fonctions utilitaires pour l'interface
// -------------------------
function renderPaletteChips() {
  const paletteChips = document.getElementById('paletteChips');
  if (!paletteChips) return;

  paletteChips.innerHTML = '';
  params.palette.forEach((c, idx) => {
    const chip = document.createElement('span');
    chip.className = 'chip'; chip.title = 'Cliquer pour retirer';
    const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = c;
    const label = document.createElement('span'); label.textContent = c;
    chip.appendChild(sw); chip.appendChild(label);
    chip.addEventListener('click', () => {
      params.palette.splice(idx, 1);
      renderPaletteChips();
      triggerRedraw();
    });
    paletteChips.appendChild(chip);
  });
}

function triggerRedraw() {
  dirty = true;
  redraw();
}

function downloadCanvasAtTargetSize() {
  const targetSize = getTargetCanvasSize();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Créer un canvas temporaire à la taille cible
  const tempCanvas = createGraphics(targetSize.width, targetSize.height);

  // Dessiner la composition sur le canvas temporaire
  drawCompositionOnCanvas(tempCanvas, targetSize.width, targetSize.height);

  // Télécharger l'image
  save(tempCanvas, `composition-${targetSize.name.toLowerCase().replace(' ', '-')}-${stamp}.png`);
}

function drawCompositionOnCanvas(canvas, w, h) {
  canvas.clear();

  if (bgImg) {
    drawImageCoverOnCanvas(canvas, bgImg, w, h);
  } else {
    canvas.background(params.bgColor);
  }

  const cols = Math.max(1, Math.floor(params.cols));
  const rows = Math.max(1, Math.floor(params.rows));
  const cellW = w / cols;
  const cellH = h / rows;
  const cellS = Math.min(cellW, cellH);
  const pad = (params.paddingPct / 100) * cellS;
  const shapeS = Math.max(0, cellS - pad * 2);

  canvas.noStroke();

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      if (Math.random() < params.emptyProb) continue;
      const cx = gx * cellW + cellW / 2;
      const cy = gy * cellH + cellH / 2;
      if (params.palette.length === 0) continue;

      // Utiliser la couleur selon le type de preset
      const currentPreset = presets[params.currentPreset];
      if (currentPreset && currentPreset.isCustom) {
        // Pour Custom, choisir aléatoirement dans la palette
        canvas.fill(randomChoice(params.palette));
      } else {
        // Pour les autres presets, utiliser la première couleur
        canvas.fill(params.palette[0]);
      }

      let shape;
      if (params.shapeMode === 'any') {
        shape = randomChoice(['circle', 'triangle', 'square']);
      } else {
        shape = params.shapeMode;
      }

      const orientations = [0, 90, 180, 270];
      const ori = randomChoice(orientations);

      if (shape === 'circle') canvas.ellipse(cx, cy, shapeS, shapeS);
      else if (shape === 'square') { canvas.rectMode(CENTER); canvas.rect(cx, cy, shapeS, shapeS); }
      else if (shape === 'triangle') drawOrientedTriangleOnCanvas(canvas, cx, cy, shapeS, ori);
    }
  }
}

function drawImageCoverOnCanvas(canvas, img, w, h) {
  const iw = img.width, ih = img.height;
  const scale = Math.max(w / iw, h / ih);
  const nw = iw * scale, nh = ih * scale;
  const x = (w - nw) / 2;
  const y = (h - nh) / 2;
  canvas.image(img, x, y, nw, nh);
}

function drawOrientedTriangleOnCanvas(canvas, cx, cy, s, orientationDeg) {
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
  canvas.triangle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
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


// -------------------------
// p5.js — setup/draw
// -------------------------
function setup() {
  pixelDensity(2);

  // Créer le canvas avec la taille par défaut
  const defaultSize = canvasSizes[0];
  createCanvas(defaultSize.width, defaultSize.height);
  noLoop();

  buildGUI();

  // Appliquer le preset par défaut
  applyPreset(0);

  // Initialiser l'affichage du canvas
  updateCanvasDisplay();

  randomSeed(Math.floor(Math.random() * 1e9));
  noiseSeed(Math.floor(Math.random() * 1e9));
  dirty = true;
  redraw();
}

function windowResized() {
  // Mettre à jour l'affichage du canvas selon la taille de fenêtre
  updateCanvasDisplay();
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

      // Utiliser la couleur selon le type de preset
      const currentPreset = presets[params.currentPreset];
      if (currentPreset && currentPreset.isCustom) {
        // Pour Custom, choisir aléatoirement dans la palette
        fill(randomChoice(params.palette));
      } else {
        // Pour les autres presets, utiliser la première couleur
        fill(params.palette[0]);
      }
      //const shape = randomChoice(['circle', 'semicircle', 'triangle', 'square']);

      let shape;
      if (params.shapeMode === 'any') {
        shape = randomChoice(['circle', 'triangle', 'square']);
      } else {
        shape = params.shapeMode; // force a single shape
      }



      const orientations = [0, 90, 180, 270];
      const ori = randomChoice(orientations);

      if (shape === 'circle') ellipse(cx, cy, shapeS, shapeS);
      else if (shape === 'square') { rectMode(CENTER); rect(cx, cy, shapeS, shapeS); }
      else if (shape === 'triangle') drawOrientedTriangle(cx, cy, shapeS, ori);
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

  const shapeModeEl = document.getElementById('shapeMode');
  const presetSelectorEl = document.getElementById('presetSelector');
  const canvasSizeEl = document.getElementById('canvasSize');

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

  if (shapeModeEl) shapeModeEl.value = params.shapeMode;

  renderPaletteChips();

  colsEl.addEventListener('input', () => { params.cols = Number(colsEl.value); triggerRedraw(); });
  rowsEl.addEventListener('input', () => { params.rows = Number(rowsEl.value); triggerRedraw(); });
  paddingEl.addEventListener('input', () => { params.paddingPct = Number(paddingEl.value); paddingVal.textContent = params.paddingPct + '%'; triggerRedraw(); });
  emptyEl.addEventListener('input', () => { params.emptyProb = Number(emptyEl.value); emptyVal.textContent = Math.round(params.emptyProb * 100) + '%'; triggerRedraw(); });
  bgColorEl.addEventListener('input', () => { params.bgColor = bgColorEl.value; triggerRedraw(); });

  if (shapeModeEl) {
    shapeModeEl.addEventListener('change', () => {
      params.shapeMode = shapeModeEl.value;
      triggerRedraw();
    });
  }

  if (presetSelectorEl) {
    presetSelectorEl.addEventListener('change', () => {
      applyPreset(Number(presetSelectorEl.value));
    });
  }

  if (canvasSizeEl) {
    canvasSizeEl.addEventListener('change', () => {
      setCanvasSize(Number(canvasSizeEl.value));
    });
  }

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
    downloadCanvasAtTargetSize();
  });


  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

}
