import Phaser from 'phaser';
import { ENEMY } from '../core/Constants.js';

const MatterLib = Phaser.Physics.Matter.Matter;

// Ennemi simple qui patrouille horizontalement entre minX et maxX.
// Corps Matter dynamique (la gravité le maintient sur sa plateforme) ; on pilote
// la vitesse horizontale à la main et on inverse le sens aux bornes.
export default class Enemy extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y, { minX, maxX, speed } = {}) {
    super(scene.matter.world, x, y, 'enemy');
    scene.add.existing(this);

    const body = MatterLib.Bodies.rectangle(x, y, ENEMY.WIDTH, ENEMY.HEIGHT, {
      chamfer: { radius: 6 },
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      label: 'enemy',
    });
    this.setExistingBody(body);
    this.setFixedRotation();
    this.setPosition(x, y);

    this.minX = minX ?? x - 100;
    this.maxX = maxX ?? x + 100;
    this.dir = 1;
    this.speed = speed ?? ENEMY.SPEED;
    this.alive = true;
  }

  update() {
    if (!this.alive) return;
    if (this.x <= this.minX) this.dir = 1;
    else if (this.x >= this.maxX) this.dir = -1;
    this.setVelocityX(this.dir * this.speed);
    this.setFlipX(this.dir < 0);
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.setSensor(true); // ne bloque plus, ne fait plus de dégâts
    this.setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.4,
      angle: 90,
      duration: 160,
      onComplete: () => this.destroy(),
    });
  }
}
