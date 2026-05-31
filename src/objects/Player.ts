import Phaser from 'phaser';
import { TEX } from '../gfx/sprites';

export type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean; // true solo nel frame in cui si preme (edge)
};

const SPEED = 200;
const JUMP_VELOCITY = -470;
const SCALE = 3;

/**
 * Pezz: corre, salta, si "schiaccia" un po' quando salta/atterra (juice).
 * Sprite generata a runtime (vedi gfx/sprites.ts), scalata 3x e pixel-perfect.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private wasOnFloor = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.pezz);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(SCALE);
    this.setOrigin(0.5, 1); // ancora ai piedi: più naturale per un platform
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    // Hitbox un filo più stretta dello sprite per salti meno "appiccicosi".
    body.setSize(10, 16);
    body.setOffset(2, 0);
    body.setMaxVelocity(SPEED, 900);
  }

  update(input: InputState): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;

    if (input.left) {
      this.setVelocityX(-SPEED);
      this.setFlipX(true);
    } else if (input.right) {
      this.setVelocityX(SPEED);
      this.setFlipX(false);
    } else {
      // decelerazione rapida per controllo "arcade"
      this.setVelocityX(body.velocity.x * 0.6);
      if (Math.abs(body.velocity.x) < 8) this.setVelocityX(0);
    }

    if (input.jump && onFloor) {
      this.setVelocityY(JUMP_VELOCITY);
      this.squash(0.78, 1.22); // allungato in salita
    }

    // atterraggio: piccolo schiacciamento
    if (onFloor && !this.wasOnFloor) {
      this.squash(1.25, 0.8);
    }
    this.wasOnFloor = onFloor;
  }

  /** Effetto "squash & stretch" che torna alla scala base. */
  private squash(sx: number, sy: number): void {
    this.setScale(SCALE * sx, SCALE * sy);
    this.scene.tweens.add({
      targets: this,
      scaleX: SCALE,
      scaleY: SCALE,
      duration: 160,
      ease: 'Quad.out',
    });
  }

  /** Rimbalzo dopo aver schiacciato un nemico. */
  bounce(): void {
    this.setVelocityY(JUMP_VELOCITY * 0.6);
    this.squash(0.8, 1.2);
  }
}
