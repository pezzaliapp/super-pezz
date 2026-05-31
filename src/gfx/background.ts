import Phaser from 'phaser';

// Texture di sfondo (cielo, nuvole, colline) generate via canvas.
// Nuvole e colline sono pensate per essere ripetute orizzontalmente
// (tileSprite) e mosse in parallasse.

export const BG = {
  sky: 'bg-sky',
  clouds: 'bg-clouds',
  hillsFar: 'bg-hills-far',
  hillsNear: 'bg-hills-near',
} as const;

const SKY_TOP = '#bdecff';
const SKY_BOTTOM = '#62b8f6';

/** Cielo: gradiente verticale (1px largo, alto come il mondo). */
function makeSky(scene: Phaser.Scene, height: number): void {
  if (scene.textures.exists(BG.sky)) return;
  const canvas = scene.textures.createCanvas(BG.sky, 8, height);
  if (!canvas) return;
  const ctx = canvas.getContext();
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, height);
  canvas.refresh();
}

/** Nuvola pixel "a bolle" centrata in (cx,cy). */
function blob(ctx: CanvasRenderingContext2D, cx: number, cy: number, parts: [number, number, number][], color: string): void {
  ctx.fillStyle = color;
  for (const [dx, dy, r] of parts) ctx.beginPath(), ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2), ctx.fill();
}

/** Striscia di nuvole ripetibile (sfondo trasparente). */
function makeClouds(scene: Phaser.Scene): void {
  if (scene.textures.exists(BG.clouds)) return;
  const w = 360, h = 160;
  const canvas = scene.textures.createCanvas(BG.clouds, w, h);
  if (!canvas) return;
  const ctx = canvas.getContext();
  const shade = '#e4f3ff';
  // due nuvole, posizionate così da reggere il tiling
  for (const [cx, cy] of [[80, 50], [250, 90]] as const) {
    blob(ctx, cx, cy + 4, [[0, 0, 14], [18, 4, 11], [-18, 5, 10], [34, 8, 7]], shade);
    blob(ctx, cx, cy, [[0, 0, 13], [18, 4, 10], [-18, 5, 9], [34, 8, 6]], '#ffffff');
  }
  canvas.refresh();
}

/** Fascia di colline tondeggianti ripetibile, con puntini sulle foglie. */
function makeHills(
  scene: Phaser.Scene,
  key: string,
  opts: { w: number; h: number; period: number; radius: number; baseline: number; color: string; dark: string; dot: string }
): void {
  if (scene.textures.exists(key)) return;
  const { w, h, period, radius, baseline, color, dark, dot } = opts;
  const canvas = scene.textures.createCanvas(key, w, h);
  if (!canvas) return;
  const ctx = canvas.getContext();

  // corpo pieno sotto la baseline
  ctx.fillStyle = color;
  ctx.fillRect(0, baseline, w, h - baseline);
  // cupole periodiche (seamless: il periodo divide w)
  for (let cx = period / 2; cx < w + period; cx += period) {
    ctx.beginPath();
    ctx.arc(cx, baseline, radius, Math.PI, 0);
    ctx.fill();
  }
  // bordo superiore più scuro (ombra fogliame) lungo le cupole
  ctx.fillStyle = dark;
  for (let cx = period / 2; cx < w + period; cx += period) {
    ctx.beginPath();
    ctx.arc(cx, baseline, radius, Math.PI, 0);
    ctx.lineTo(cx + radius - 2, baseline);
    ctx.arc(cx, baseline, radius - 3, 0, Math.PI, true);
    ctx.fill();
  }
  // puntini più scuri sparsi (pattern periodico → niente cuciture)
  ctx.fillStyle = dot;
  for (let x = 6; x < w; x += 13) {
    const y = baseline + 8 + ((x * 7) % 40);
    ctx.fillRect(x % w, y, 2, 2);
    ctx.fillRect((x + 6) % w, y + 14, 2, 2);
  }
  canvas.refresh();
}

export function buildBackgroundTextures(scene: Phaser.Scene, worldHeight: number): void {
  makeSky(scene, worldHeight);
  makeClouds(scene);
  // collina lontana: più chiara/desaturata, cupole ampie
  makeHills(scene, BG.hillsFar, {
    w: 384, h: 220, period: 192, radius: 120, baseline: 95,
    color: '#8fd49a', dark: '#74bd83', dot: '#5fae72',
  });
  // collina vicina: verde più acceso, cupole più piccole
  makeHills(scene, BG.hillsNear, {
    w: 320, h: 220, period: 160, radius: 95, baseline: 120,
    color: '#57c25a', dark: '#3da347', dot: '#2f8a3a',
  });
}
