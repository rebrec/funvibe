import Phaser from 'phaser';
import { ENEMY } from '../core/Constants.js';

const MatterLib = Phaser.Physics.Matter.Matter;

// Ennemi qui patrouille horizontalement entre minX et maxX, avec des sauts
// occasionnels et une légère variation de vitesse. Corps Matter dynamique
// (la gravité le maintient au sol). Les ennemis se traversent entre eux
// (collisionFilter.group négatif) mais restent solides face au sol et au joueur.
export default class Enemy extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y, { minX, maxX, speed, hp } = {}) {
    super(scene.matter.world, x, y, 'enemy');
    scene.add.existing(this);

    const body = MatterLib.Bodies.rectangle(x, y, ENEMY.WIDTH, ENEMY.HEIGHT, {
      chamfer: { radius: 6 },
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: 'enemy',
      collisionFilter: { group: -1 }, // les ennemis ne se gênent pas entre eux
    });
    this.setExistingBody(body);
    this.setFixedRotation();
    this.setPosition(x, y);

    this.minX = minX ?? x - 100;
    this.maxX = maxX ?? x + 100;
    this.dir = 1;
    this.speed = (speed ?? ENEMY.SPEED) * Phaser.Math.FloatBetween(0.85, 1.15);
    this.hp = hp ?? ENEMY.HP;
    this.alive = true;
    this.lastHitAttackId = -1; // évite plusieurs touches pour une même frappe
    this.jumpTimer = Phaser.Math.Between(ENEMY.JUMP_INTERVAL_MIN, ENEMY.JUMP_INTERVAL_MAX);
  }

  update(delta) {
    if (!this.alive) return;

    if (this.x <= this.minX) this.dir = 1;
    else if (this.x >= this.maxX) this.dir = -1;
    this.setVelocityX(this.dir * this.speed);
    this.setFlipX(this.dir < 0);

    // Saut occasionnel (quand à peu près au sol).
    this.jumpTimer -= delta;
    const grounded = Math.abs(this.body.velocity.y) < 0.6;
    if (this.jumpTimer <= 0 && grounded) {
      this.setVelocityY(-ENEMY.JUMP_VELOCITY);
      this.jumpTimer = Phaser.Math.Between(ENEMY.JUMP_INTERVAL_MIN, ENEMY.JUMP_INTERVAL_MAX);
    }
  }

  // Reçoit un coup. Meurt si les PV tombent à 0, sinon flash + petit sursaut.
  takeHit(dmg = 1) {
    if (!this.alive) return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.kill();
      return;
    }
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });
    this.setVelocityY(-3);
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.setSensor(true); // ne bloque plus, ne fait plus de dégâts
    this.setIgnoreGravity(true);
    this.setVelocity(0, 0);
    this.setTintFill(0xffffff);
    // Effet sobre : écrasement + disparition (placeholder, vraie anim plus tard).
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 0.6,
      alpha: 0,
      duration: 170,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });
  }
}
