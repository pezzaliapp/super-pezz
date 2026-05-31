import Phaser from 'phaser';

/**
 * Controlli touch on-screen (solo per dispositivi touch).
 * Tre pulsanti fissi alla camera: ◀ ▶ e SALTA.
 * Espone lo stato "tenuto premuto"; l'edge del salto lo calcola la scena.
 */
export class TouchControls {
  left = false;
  right = false;
  jump = false;

  private readonly enabled: boolean;

  constructor(scene: Phaser.Scene) {
    // Abilita più tocchi simultanei (muovere + saltare insieme).
    scene.input.addPointer(2);

    this.enabled =
      scene.sys.game.device.input.touch && !scene.sys.game.device.os.desktop;
    if (!this.enabled) return;

    const { width, height } = scene.scale;
    const r = Math.round(Math.min(width, height) * 0.09); // raggio adattivo
    const pad = r * 1.6;
    const y = height - pad;

    this.makeButton(scene, pad, y, r, '◀', () => (this.left = true), () => (this.left = false));
    this.makeButton(scene, pad * 2.7, y, r, '▶', () => (this.right = true), () => (this.right = false));
    this.makeButton(scene, width - pad, y, r, '⤒', () => (this.jump = true), () => (this.jump = false));
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    r: number,
    glyph: string,
    onDown: () => void,
    onUp: () => void
  ): void {
    const circle = scene.add
      .circle(x, y, r, 0xffffff, 0.18)
      .setStrokeStyle(2, 0xffffff, 0.45)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });

    scene.add
      .text(x, y, glyph, { fontSize: `${Math.round(r * 1.1)}px`, color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setScrollFactor(0)
      .setDepth(1001);

    const press = () => {
      onDown();
      circle.setFillStyle(0xffffff, 0.35);
    };
    const release = () => {
      onUp();
      circle.setFillStyle(0xffffff, 0.18);
    };

    circle.on('pointerdown', press);
    circle.on('pointerup', release);
    circle.on('pointerout', release);
    circle.on('pointerupoutside', release);
  }
}
