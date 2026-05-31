import Phaser from 'phaser';
import { PEZZ_TEX, ANIM, FW, FH } from '../gfx/character';
import { TEX } from '../gfx/sprites';

export type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean; // true solo nel frame in cui si preme (edge)
};

const SPEED = 200;
const JUMP_VELOCITY = -470;
const SCALE = 2; // intero → pixel netti

/**
 * Pezz: corre, salta, con animazioni (idle/corsa/salto), squash & stretch
 * e polvere sotto i piedi mentre corre.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private wasOnFloor = false;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PEZZ_TEX, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(SCALE);
    this.setOrigin(0.5, 1);
    this.setDepth(10);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    // Hitbox stretta sul corpo (il frame è 24x28 con margini).
    body.setSize(9, 22);
    body.setOffset((FW - 9) / 2, FH - 23);
    body.setMaxVelocity(SPEED, 950);

    // Polvere: emessa solo mentre corre a terra (gestita in update()).
    this.dust = scene.add.particles(0, 0, TEX.dust, {
      lifespan: 360,
      speed: { min: 8, max: 28 },
      angle: { min: 190, max: 350 },
      gravityY: -30,
      scale: { start: 1.1, end: 0 },
      alpha: { start: 0.7, end: 0 },
      frequency: 70,
      quantity: 1,
      emitting: false,
    });
    this.dust.setDepth(9);

    this.play(ANIM.idle);
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
      this.setVelocityX(body.velocity.x * 0.6);
      if (Math.abs(body.velocity.x) < 8) this.setVelocityX(0);
    }

    if (input.jump && onFloor) {
      this.setVelocityY(JUMP_VELOCITY);
      this.squash(0.78, 1.22);
    }

    if (onFloor && !this.wasOnFloor) this.squash(1.25, 0.8);
    this.wasOnFloor = onFloor;

    // --- animazioni in base allo stato ---
    const moving = Math.abs(body.velocity.x) > 12;
    if (!onFloor) this.play(ANIM.jump, true);
    else if (moving) this.play(ANIM.run, true);
    else this.play(ANIM.idle, true);

    // --- polvere ai piedi mentre corre a terra ---
    this.dust.setPosition(this.x - (this.flipX ? -6 : 6), this.y - 2);
    this.dust.emitting = onFloor && moving;
  }

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

  bounce(): void {
    this.setVelocityY(JUMP_VELOCITY * 0.6);
    this.squash(0.8, 1.2);
  }
}
