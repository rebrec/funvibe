import Phaser from 'phaser';
import { PROJECTILE } from '../core/Constants.js';

// Projectile (shuriken) : corps capteur Matter qui file horizontalement dans le
// sens du lancer, en ignorant la gravité. Tourne sur lui-même (vitesse angulaire).
// La détection d'impact (ennemi / mur) est gérée par LevelScene.
export default class Projectile extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y, dir) {
    super(scene.matter.world, x, y, 'shuriken');
    scene.add.existing(this);

    this.setBody({ type: 'circle', radius: PROJECTILE.RADIUS }, { isSensor: true, label: 'projectile' });
    this.setIgnoreGravity(true);
    this.setVelocity(dir * PROJECTILE.SPEED, 0);
    this.setAngularVelocity(0.4 * dir);
    this.setDepth(4);

    this.life = PROJECTILE.LIFETIME;
  }
}
