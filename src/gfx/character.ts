import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// PEZZ — personaggio pixel-art procedurale.
// Ogni frame è disegnato da funzioni a partire da una "posa" (posizione di
// piedi/mani + rimbalzo del corpo). Così le animazioni sono vere, coerenti,
// e tutto resta codice modificabile (niente PNG).
// ---------------------------------------------------------------------------

export const PEZZ_TEX = 'pezz';
export const FW = 24; // larghezza frame
export const FH = 28; // altezza frame

export const ANIM = {
  idle: 'pezz-idle',
  run: 'pezz-run',
  jump: 'pezz-jump',
} as const;

// Palette personaggio
const SKIN = '#d79256'; // abbronzato
const SKIN_DK = '#a86a38';
const SKIN_LT = '#ecb87f';
const HAIR = '#f4f4fb'; // bianco
const HAIR_DK = '#c9cad8';
const PANTS = '#23232f'; // neri
const PANTS_DK = '#141420';
const SHOE = '#3c3c4a';
const GLASS = '#0d0d14';
const GLASS_LT = '#3a3f52';
const MOUTH = '#7a3b2b';

type XY = [number, number];
type Pose = {
  fL: XY; fR: XY; // piedi (assoluti, non seguono il bob)
  hL: XY; hR: XY; // mani
  bob: number; // sollevamento corpo (negativo = su)
  wind: number; // quanto i capelli sventolano all'indietro
};

// 6 frame: 0=idle, 1..4=corsa, 5=salto. Personaggio rivolto a DESTRA.
const POSES: Pose[] = [
  // idle
  { fL: [9, 27], fR: [15, 27], hL: [7, 19], hR: [17, 19], bob: 0, wind: 1 },
  // run0 — gamba dx avanti, braccio sx avanti
  { fL: [7, 25], fR: [18, 26], hL: [18, 16], hR: [7, 18], bob: 0, wind: 3 },
  // run1 — passaggio, corpo su
  { fL: [9, 26], fR: [14, 27], hL: [15, 17], hR: [9, 17], bob: -1, wind: 4 },
  // run2 — gamba sx avanti, braccio dx avanti
  { fL: [18, 26], fR: [7, 25], hL: [7, 18], hR: [18, 16], bob: 0, wind: 4 },
  // run3 — passaggio, corpo su
  { fL: [14, 27], fR: [9, 26], hL: [9, 17], hR: [15, 17], bob: -1, wind: 5 },
  // jump — gambe raccolte, braccia su
  { fL: [8, 23], fR: [16, 22], hL: [6, 9], hR: [19, 10], bob: -1, wind: 5 },
];

function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

/** Arto come "linea spessa" da (x0,y0) a (x1,y1). */
function limb(
  ctx: CanvasRenderingContext2D,
  ox: number,
  x0: number, y0: number, x1: number, y1: number,
  w: number, color: string
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const half = (w - 1) / 2;
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t - half);
    const y = Math.round(y0 + (y1 - y0) * t - half);
    ctx.fillRect(ox + x, y, w, w);
  }
}

function drawLeg(ctx: CanvasRenderingContext2D, ox: number, hx: number, hy: number, fx: number, fy: number, color: string): void {
  limb(ctx, ox, hx, hy, fx, fy, 3, color);
  // scarpa
  ctx.fillStyle = SHOE;
  ctx.fillRect(ox + Math.round(fx) - 1, Math.round(fy) - 1, 4, 2);
}

function drawArm(ctx: CanvasRenderingContext2D, ox: number, sx: number, sy: number, hx: number, hy: number, color: string): void {
  limb(ctx, ox, sx, sy, hx, hy, 2, color);
  px(ctx, ox + hx, hy, SKIN_LT); // mano
}

function drawPezzFrame(ctx: CanvasRenderingContext2D, ox: number, p: Pose): void {
  const cx = 12;
  const shY = 12 + p.bob; // spalle
  const hipY = 19 + p.bob; // bacino

  // --- arti del lato lontano (sinistro), più scuri ---
  drawLeg(ctx, ox, cx - 2, hipY, p.fL[0], p.fL[1], PANTS_DK);
  drawArm(ctx, ox, cx - 3, shY, p.hL[0], p.hL[1] + p.bob, SKIN_DK);

  // --- torso nudo (trapezio) con ombreggiatura ---
  for (let y = shY - 1; y <= hipY; y++) {
    const t = (y - (shY - 1)) / (hipY - (shY - 1));
    const half = Math.round(4.5 - 1.6 * t);
    for (let x = cx - half; x <= cx + half; x++) {
      // luce da sinistra: bordo dx più scuro
      let c = SKIN;
      if (x >= cx + half - 1) c = SKIN_DK;
      else if (x <= cx - half + 1) c = SKIN_LT;
      px(ctx, ox + x, y, c);
    }
  }
  // pettorali + linea addominali
  px(ctx, ox + cx - 2, shY + 1, SKIN_DK);
  px(ctx, ox + cx + 1, shY + 1, SKIN_DK);
  px(ctx, ox + cx, shY + 3, SKIN_DK);
  px(ctx, ox + cx, shY + 5, SKIN_DK);

  // --- bacino / cintura pantaloni ---
  ctx.fillStyle = PANTS;
  ctx.fillRect(ox + cx - 3, hipY - 1, 7, 3);

  // --- testa + collo ---
  const headTop = 3 + p.bob;
  const headBot = 10 + p.bob;
  px(ctx, ox + cx, headBot, SKIN); // collo
  px(ctx, ox + cx - 1, headBot, SKIN);
  for (let y = headTop; y <= headBot - 1; y++) {
    const edge = y === headTop || y === headBot - 1 ? 2 : 3;
    for (let x = cx - edge; x <= cx + edge; x++) px(ctx, ox + x, y, SKIN);
  }
  // ombra mascella
  px(ctx, ox + cx + 2, headBot - 1, SKIN_DK);
  px(ctx, ox + cx + 1, headBot - 1, SKIN_DK);

  // --- occhiali da sole neri ---
  const gy = headTop + 3;
  ctx.fillStyle = GLASS;
  ctx.fillRect(ox + cx - 3, gy, 3, 2); // lente sx
  ctx.fillRect(ox + cx + 1, gy, 3, 2); // lente dx
  px(ctx, ox + cx, gy, GLASS); // ponte
  px(ctx, ox + cx - 3, gy, GLASS_LT); // riflesso
  px(ctx, ox + cx + 1, gy, GLASS_LT);

  // bocca / mezzo sorriso
  px(ctx, ox + cx - 1, headBot - 1, MOUTH);
  px(ctx, ox + cx, headBot - 1, MOUTH);

  // --- capelli bianchi spettinati al vento (verso sinistra) ---
  const w = p.wind;
  ctx.fillStyle = HAIR;
  // calotta
  for (let x = cx - 4; x <= cx + 3; x++) ctx.fillRect(ox + x, headTop - 1, 1, 2);
  // ciuffi in alto
  for (const sx of [cx - 4, cx - 2, cx, cx + 2, cx + 3]) px(ctx, ox + sx, headTop - 2, HAIR);
  px(ctx, ox + cx - 3, headTop - 3, HAIR);
  px(ctx, ox + cx + 1, headTop - 3, HAIR);
  // ciuffi che sventolano all'indietro (sinistra), lunghezza ~ wind
  for (let i = 1; i <= w; i++) {
    px(ctx, ox + cx - 4 - i, headTop + Math.min(i, 2), HAIR);
    if (i % 2 === 0) px(ctx, ox + cx - 4 - i, headTop - 1, HAIR_DK);
  }
  // ombra capelli
  px(ctx, ox + cx + 3, headTop, HAIR_DK);

  // --- arti del lato vicino (destro), in primo piano ---
  drawLeg(ctx, ox, cx + 2, hipY, p.fR[0], p.fR[1], PANTS);
  drawArm(ctx, ox, cx + 3, shY, p.hR[0], p.hR[1] + p.bob, SKIN);
}

/** Genera la texture-spritesheet di Pezz e definisce i frame. */
export function buildPezzTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PEZZ_TEX)) return;
  const canvas = scene.textures.createCanvas(PEZZ_TEX, FW * POSES.length, FH);
  if (!canvas) return;
  const ctx = canvas.getContext();
  POSES.forEach((p, i) => drawPezzFrame(ctx, i * FW, p));
  POSES.forEach((_, i) => canvas.add(i, 0, i * FW, 0, FW, FH));
  canvas.refresh();
}

/** Registra le animazioni (idle / corsa / salto). */
export function createPezzAnims(scene: Phaser.Scene): void {
  const a = scene.anims;
  if (a.exists(ANIM.run)) return;
  a.create({ key: ANIM.idle, frames: [{ key: PEZZ_TEX, frame: 0 }], frameRate: 1, repeat: -1 });
  a.create({
    key: ANIM.run,
    frames: a.generateFrameNumbers(PEZZ_TEX, { frames: [1, 2, 3, 4] }),
    frameRate: 12,
    repeat: -1,
  });
  a.create({ key: ANIM.jump, frames: [{ key: PEZZ_TEX, frame: 5 }], frameRate: 1, repeat: -1 });
}
