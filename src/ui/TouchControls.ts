import Phaser from 'phaser';

/**
 * Controlli touch on-screen (solo su dispositivi touch).
 * Zone di tocco GRANDI e generose: ◀ ▶ in basso a sinistra, SALTA a destra.
 * Espone lo stato "tenuto premuto"; coyote/buffer e l'auto-hop li gestisce
 * il Player, così il salto è reattivo anche tenendo premuto.
 */
export class TouchControls {
  left = false;
  right = false;
  jump = false;

  private readonly enabled: boolean;

  constructor(scene: Phaser.Scene) {
    scene.input.addPointer(2); // più tocchi insieme (muovere + saltare)

    this.enabled =
      scene.sys.game.device.input.touch && !scene.sys.game.device.os.desktop;
    if (!this.enabled) return;

    const W = scene.scale.width;
    const H = scene.scale.height;

    // Direzionali in basso a sinistra (due zone affiancate).
    this.makeZone(scene, W * 0.02, H * 0.56, W * 0.17, H * 0.42, '◀', (v) => (this.left = v));
    this.makeZone(scene, W * 0.20, H * 0.56, W * 0.17, H * 0.42, '▶', (v) => (this.right = v));
    // Salto: grande area in basso a destra.
    this.makeZone(scene, W * 0.64, H * 0.50, W * 0.34, H * 0.48, 'SALTA', (v) => (this.jump = v));
  }

  private makeZone(
    scene: Phaser.Scene,
    x: number, y: number, w: number, h: number,
    glyph: string,
    set: (v: boolean) => void
  ): void {
    // Area di tocco invisibile ma generosa (tutto il rettangolo).
    const zone = scene.add
      .zone(x, y, w, h)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();

    // Pulsante visivo al centro della zona.
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) * 0.42;
    const circle = scene.add
      .circle(cx, cy, r, 0xffffff, 0.16)
      .setStrokeStyle(3, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    scene.add
      .text(cx, cy, glyph, { fontFamily: 'monospace', fontSize: `${Math.round(r * 0.7)}px`, color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0.8)
      .setScrollFactor(0)
      .setDepth(1001);

    const press = () => { set(true); circle.setFillStyle(0xffffff, 0.34); };
    const release = () => { set(false); circle.setFillStyle(0xffffff, 0.16); };

    zone.on('pointerdown', press);
    zone.on('pointerup', release);
    zone.on('pointerout', release);
    zone.on('pointerupoutside', release);
  }
}
