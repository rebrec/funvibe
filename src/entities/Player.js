import Phaser from 'phaser';
import { PLAYER, PHYSICS } from '../core/Constants.js';

// Déplace `current` vers `target` d'au plus `maxDelta` (lissage d'accélération/freinage).
function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(PLAYER.WIDTH, PLAYER.HEIGHT);
    this.body.setMaxVelocityY(PLAYER.MAX_FALL_SPEED);

    // État pour le "feel"
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpsRemaining = PLAYER.MAX_JUMPS;
    this.isJumping = false;
  }

  // Appelé depuis Scene.update(time, delta).
  update(delta, input) {
    const dt = delta / 1000;
    const body = this.body;
    const onGround = body.blocked.down || body.touching.down;

    const axis = input.getMoveAxis();
    const jumpJustPressed = input.isJumpJustPressed();
    const jumpHeld = input.isJumpHeld();

    // --- Timers d'aide ---
    if (onGround) {
      this.coyoteTimer = PLAYER.COYOTE_TIME;
      this.jumpsRemaining = PLAYER.MAX_JUMPS;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    if (jumpJustPressed) this.jumpBufferTimer = PLAYER.JUMP_BUFFER;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    // --- Déplacement horizontal ---
    const onGroundNow = onGround;
    const accel = onGroundNow ? PLAYER.ACCELERATION : PLAYER.AIR_ACCELERATION;
    const decel = onGroundNow ? PLAYER.DECELERATION : PLAYER.AIR_DECELERATION;
    const targetVx = axis * PLAYER.MAX_SPEED;
    const rate = axis !== 0 ? accel : decel;
    body.setVelocityX(approach(body.velocity.x, targetVx, rate * dt));

    if (axis !== 0) this.setFlipX(axis < 0);

    // --- Saut (avec coyote time + jump buffering) ---
    if (this.jumpBufferTimer > 0) {
      if (onGround || this.coyoteTimer > 0) {
        body.setVelocityY(-PLAYER.JUMP_VELOCITY);
        this.jumpsRemaining = PLAYER.MAX_JUMPS - 1;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.isJumping = true;
      } else if (this.jumpsRemaining > 0) {
        body.setVelocityY(-PLAYER.DOUBLE_JUMP_VELOCITY);
        this.jumpsRemaining -= 1;
        this.jumpBufferTimer = 0;
        this.isJumping = true;
      }
    }

    // --- Hauteur de saut variable : relâcher tôt coupe la montée ---
    if (this.isJumping && !jumpHeld && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
      this.isJumping = false;
    }
    if (body.velocity.y >= 0) this.isJumping = false;

    // --- Chute moins "flottante" : gravité accrue en descente ---
    if (body.velocity.y > 0) {
      body.setGravityY((PLAYER.FALL_GRAVITY_MULTIPLIER - 1) * PHYSICS.GRAVITY_Y);
    } else {
      body.setGravityY(0);
    }
  }
}
