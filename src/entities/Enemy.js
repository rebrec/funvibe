import Phaser from 'phaser';
import { ENEMY } from '../core/Constants.js';

const MatterLib = Phaser.Physics.Matter.Matter;

// Ennemi avec deux comportements possibles :
//  - 'walker'  : patrouille gauche-droite + sauts occasionnels.
//  - 'charger' : avance lentement, s'arrête (clignote en avertissement), puis
//                accélère brutalement (charge) avant de recommencer.
// Corps Matter dynamique (la gravité le maintient au sol). Les ennemis se
// traversent entre eux mais restent solides face au sol et au joueur.
export default class Enemy extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y, { minX, maxX, speed, hp, behavior } = {}) {
    const textureKey = (behavior ?? 'walker') === 'charger' ? 'enemy-charger' : 'enemy-walker';
    super(scene.matter.world, x, y, textureKey);
    scene.add.existing(this);

    const body = MatterLib.Bodies.rectangle(x, y, ENEMY.WIDTH, ENEMY.HEIGHT, {
      chamfer: { radius: 6 },
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: 'enemy',
      collisionFilter: { group: -1 },
    });
    this.setExistingBody(body);
    this.setFixedRotation();
    this.setPosition(x, y);
    this.setFrame(0);

    this.minX = minX ?? x - 100;
    this.maxX = maxX ?? x + 100;
    this.dir = 1;
    this.speed = (speed ?? ENEMY.SPEED) * Phaser.Math.FloatBetween(0.85, 1.15);
    this.hp = hp ?? ENEMY.HP;
    this.alive = true;
    this.lastHitAttackId = -1;
    this.behavior = behavior ?? 'walker';

    // walker
    this.jumpTimer = Phaser.Math.Between(ENEMY.JUMP_INTERVAL_MIN, ENEMY.JUMP_INTERVAL_MAX);

    // charger
    this.phase = 'creep';
    this.phaseTimer = ENEMY.CHARGER.CREEP_TIME;
    this.dashSpeed = 0;
  }

  update(delta) {
    if (!this.alive) return;

    // Animation de marche (rebond) — clé selon le comportement.
    this.play(this.behavior === 'charger' ? 'charger-walk' : 'walker-walk', true);

    // Inversion aux bornes de patrouille (commun aux deux comportements).
    if (this.x <= this.minX) this.dir = 1;
    else if (this.x >= this.maxX) this.dir = -1;
    this.setFlipX(this.dir < 0);

    if (this.behavior === 'charger') this.updateCharger(delta);
    else this.updateWalker(delta);
  }

  updateWalker(delta) {
    this.setVelocityX(this.dir * this.speed);

    this.jumpTimer -= delta;
    const grounded = Math.abs(this.body.velocity.y) < 0.6;
    if (this.jumpTimer <= 0 && grounded) {
      this.setVelocityY(-ENEMY.JUMP_VELOCITY);
      this.jumpTimer = Phaser.Math.Between(ENEMY.JUMP_INTERVAL_MIN, ENEMY.JUMP_INTERVAL_MAX);
    }
  }

  updateCharger(delta) {
    const C = ENEMY.CHARGER;
    this.phaseTimer -= delta;

    if (this.phase === 'creep') {
      this.setVelocityX(this.dir * C.CREEP_SPEED);
      if (this.phaseTimer <= 0) {
        this.phase = 'pause';
        this.phaseTimer = C.PAUSE_TIME;
      }
    } else if (this.phase === 'pause') {
      this.setVelocityX(0);
      // Clignotement d'avertissement en fin de pause.
      if (this.phaseTimer <= C.TELEGRAPH_TIME) this.setTint(0xffd23f);
      if (this.phaseTimer <= 0) {
        this.clearTint();
        this.phase = 'dash';
        this.phaseTimer = C.DASH_TIME;
        this.dashSpeed = C.DASH_START_SPEED;
      }
    } else {
      // dash : accélération ~exponentielle plafonnée
      this.dashSpeed = Math.min(this.dashSpeed * C.DASH_ACCEL, C.DASH_MAX_SPEED);
      this.setVelocityX(this.dir * this.dashSpeed);
      if (this.phaseTimer <= 0) {
        this.phase = 'creep';
        this.phaseTimer = C.CREEP_TIME;
      }
    }
  }

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
    this.setSensor(true);
    this.setIgnoreGravity(true);
    this.setVelocity(0, 0);
    this.setTintFill(0xffffff);
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
