// All the "art" in this scene is generated at runtime onto <canvas> elements
// using rough.js (hand-drawn / sketchy 2D rendering), then used as textures
// on plain 3D geometry. That's the trick behind "a 2D drawn universe that
// reflects 3D": the shapes and depth are real 3D, the surfaces look like a
// pencil sketch.

const INK = '#1c1a14';
const PAPER = '#f4efe2';
const PAPER_DARK = '#e7dfc9';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const rc = rough.canvas(canvas);
  return { canvas, ctx, rc };
}

function fillPaper(ctx, w, h, color = PAPER) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

// Small stray pencil marks scattered across otherwise blank paper, like the
// little floating tick-marks in the reference sketch's empty margins. Also
// makes a texture read as "drawn" even at close range, instead of flattening
// into a plain, hard-to-tell-apart-from-background colour.
function addPaperGrain(rc, w, h, count = 18) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const len = 4 + Math.random() * 10;
    const angle = Math.random() * Math.PI;
    rc.line(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len, {
      stroke: INK,
      strokeWidth: 1,
      roughness: 2.2,
      seed: i * 7 + 3,
    });
  }
}

// A slightly wobbly hand-inked line, drawn as 2-3 overlapping rough strokes
// for extra "pencil" texture.
function inkLine(rc, x1, y1, x2, y2, opts = {}) {
  const base = {
    stroke: INK,
    strokeWidth: opts.strokeWidth || 2.5,
    roughness: opts.roughness ?? 2,
    bowing: opts.bowing ?? 1.2,
    seed: Math.floor(Math.random() * 1000),
  };
  rc.line(x1, y1, x2, y2, base);
  if (opts.double !== false) {
    rc.line(x1, y1, x2, y2, { ...base, seed: base.seed + 1, strokeWidth: base.strokeWidth * 0.6 });
  }
}

function inkText(ctx, text, x, y, { font = '48px "Permanent Marker"', align = 'left', passes = 3, jitter = 1.4 } = {}) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < passes; i++) {
    ctx.fillStyle = `rgba(28,26,20,${0.85 / passes + 0.15})`;
    const dx = (Math.random() - 0.5) * jitter;
    const dy = (Math.random() - 0.5) * jitter;
    ctx.fillText(text, x + dx, y + dy);
  }
}

// Radiating "vanishing point" construction lines, like the fan of rays in
// the reference sketch. Converge near the texture center.
function drawRadiatingLines(rc, w, h, { count = 22, focus = [0.5, 0.5], reach = 1.35 } = {}) {
  const fx = w * focus[0];
  const fy = h * focus[1];
  const maxR = Math.max(w, h) * reach;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.05;
    const ex = fx + Math.cos(angle) * maxR;
    const ey = fy + Math.sin(angle) * maxR;
    rc.line(fx, fy, ex, ey, {
      stroke: INK,
      strokeWidth: 1.1,
      roughness: 1.6,
      bowing: 0.8,
      seed: i * 13 + 1,
    });
  }
}

export function createFloorOrCeilingTexture({ w = 1024, h = 1024, focus = [0.5, 0.5], tone = PAPER } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, tone);
  drawRadiatingLines(rc, w, h, { focus, count: 26 });
  addPaperGrain(rc, w, h, 10);
  // a soft frame so tiling seams read as intentional sketch borders
  rc.rectangle(6, 6, w - 12, h - 12, { stroke: INK, strokeWidth: 2, roughness: 2.4, fill: 'none' });
  const tex = new THREE_.CanvasTexture(canvas);
  return tex;
}

export function createDiamondFloorTexture({ w = 1024, h = 1024, cell = 96 } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, PAPER_DARK);
  for (let y = -cell; y < h + cell; y += cell) {
    for (let x = -cell; x < w + cell; x += cell) {
      const pts = [
        [x, y - cell / 2],
        [x + cell / 2, y],
        [x, y + cell / 2],
        [x - cell / 2, y],
      ];
      rc.polygon(pts, { stroke: INK, strokeWidth: 1.6, roughness: 1.8, bowing: 1, fill: 'none' });
    }
  }
  return new THREE_.CanvasTexture(canvas);
}

export function createWallTexture({ w = 1024, h = 640, baseboard = true, scribbles = 4 } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, PAPER);
  addPaperGrain(rc, w, h, 22);
  if (baseboard) {
    inkLine(rc, 0, h - 14, w, h - 14, { strokeWidth: 3 });
  }
  for (let i = 0; i < scribbles; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.6;
    rc.line(x, y, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 20, {
      stroke: INK, strokeWidth: 1, roughness: 1.5,
    });
  }
  return new THREE_.CanvasTexture(canvas);
}

export function createPillarTexture({ w = 512, h = 512 } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, '#141210');
  rc.rectangle(4, 4, w - 8, h - 8, { stroke: INK, strokeWidth: 3, roughness: 2.2, fill: '#141210', fillStyle: 'solid' });
  return new THREE_.CanvasTexture(canvas);
}

export function createElevatorInteriorTexture({ w = 768, h = 768 } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, '#faf7ee');
  // two half-open door leaves suggested by vertical lines
  inkLine(rc, w * 0.42, 0, w * 0.42, h, { strokeWidth: 3 });
  inkLine(rc, w * 0.58, 0, w * 0.58, h, { strokeWidth: 3 });
  // small call button dot, like in the reference sketch
  rc.circle(w * 0.5, h * 0.42, 10, { stroke: INK, strokeWidth: 2, roughness: 1.4, fill: INK, fillStyle: 'solid' });
  return new THREE_.CanvasTexture(canvas);
}

export function createSignTexture({ w = 512, h = 256, label = '1' } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, PAPER_DARK);
  rc.rectangle(10, 10, w - 20, h - 20, { stroke: INK, strokeWidth: 4, roughness: 1.8, fill: 'none' });
  inkText(ctx, label, w / 2, h * 0.72, { font: `${Math.floor(h * 0.55)}px "Permanent Marker"`, align: 'center', passes: 3 });
  return new THREE_.CanvasTexture(canvas);
}

export function createBlameJohnTexture({ w = 1024, h = 768 } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, PAPER);
  inkText(ctx, 'BLAME', w * 0.5, h * 0.4, { font: `${Math.floor(h * 0.16)}px "Permanent Marker"`, align: 'center', passes: 4, jitter: 2.2 });
  inkText(ctx, 'JOHN', w * 0.5, h * 0.64, { font: `${Math.floor(h * 0.18)}px "Permanent Marker"`, align: 'center', passes: 4, jitter: 2.2 });
  return new THREE_.CanvasTexture(canvas);
}

// A little hand-drawn person on the phone, matching the character in the
// reference sketch. Transparent background so it reads as a flat cut-out
// standing in the 3D space.
export function createCharacterTexture({ w = 512, h = 1024 } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5;
  const opts = { stroke: INK, strokeWidth: 3, roughness: 1.8, bowing: 1.1 };

  // legs
  rc.line(cx - 30, h * 0.62, cx - 34, h * 0.95, opts);
  rc.line(cx + 22, h * 0.62, cx + 30, h * 0.95, opts);
  // feet
  rc.line(cx - 34, h * 0.95, cx - 55, h * 0.97, opts);
  rc.line(cx + 30, h * 0.95, cx + 52, h * 0.97, opts);

  // torso / blazer
  rc.polygon([
    [cx - 55, h * 0.34],
    [cx + 50, h * 0.34],
    [cx + 40, h * 0.63],
    [cx - 45, h * 0.63],
  ], { ...opts, fill: PAPER, fillStyle: 'hachure', hachureGap: 6 });

  // far arm, resting
  rc.line(cx - 50, h * 0.37, cx - 68, h * 0.58, opts);
  // near arm, bent up to the ear (phone call pose)
  rc.line(cx + 42, h * 0.38, cx + 62, h * 0.30, opts);
  rc.line(cx + 62, h * 0.30, cx + 48, h * 0.20, opts);
  // phone
  rc.rectangle(cx + 40, h * 0.16, 16, 26, { ...opts, fill: INK, fillStyle: 'solid' });

  // neck + head
  rc.line(cx - 6, h * 0.30, cx - 6, h * 0.34, opts);
  rc.circle(cx - 2, h * 0.235, w * 0.14, opts);
  // hair scribble
  rc.line(cx - 42, h * 0.20, cx + 34, h * 0.14, { ...opts, roughness: 2.4 });
  rc.line(cx - 40, h * 0.24, cx + 30, h * 0.10, { ...opts, roughness: 2.6 });

  return new THREE_.CanvasTexture(canvas);
}

export function createCounterTexture({ w = 1024, h = 256 } = {}) {
  const { canvas, ctx, rc } = makeCanvas(w, h);
  fillPaper(ctx, w, h, '#1c1a14');
  rc.rectangle(6, 6, w - 12, h - 12, { stroke: '#000', strokeWidth: 2, roughness: 1.6, fill: '#1c1a14', fillStyle: 'solid' });
  return new THREE_.CanvasTexture(canvas);
}

// three.js is injected here so this module stays framework-agnostic to write,
// while avoiding a second import of the whole library.
let THREE_;
export function registerThree(THREE) {
  THREE_ = THREE;
}
