import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// Generatore di texture pixel-art "via codice".
// Ogni sprite è una griglia di caratteri + una palette colori.
// Niente file PNG: tutto è leggibile e modificabile da qui.
// ---------------------------------------------------------------------------

export type Palette = Record<string, string | null>; // null = trasparente

/**
 * Crea una texture Phaser disegnando la griglia `rows` con i colori `palette`.
 * Ogni carattere = 1 pixel. Le righe devono avere tutte la stessa larghezza.
 */
export function makePixelTexture(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  palette: Palette
): void {
  if (scene.textures.exists(key)) return;

  const h = rows.length;
  const w = rows[0].length;
  // Sanity check: aiuta a non sbagliare le griglie a mano.
  for (const r of rows) {
    if (r.length !== w) {
      throw new Error(`Texture "${key}": riga di larghezza ${r.length}, attesa ${w}`);
    }
  }

  const canvas = scene.textures.createCanvas(key, w, h);
  if (!canvas) return;
  const ctx = canvas.getContext();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      const color = palette[ch];
      if (!color) continue; // '.' o non mappato = trasparente
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  canvas.refresh();
}
