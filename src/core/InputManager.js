import Phaser from 'phaser';

// Abstraction des entrées : la logique de jeu ne lit JAMAIS le clavier directement,
// elle interroge des "actions" (move / jump / attack / interact). Cela permettra de
// brancher des boutons tactiles pour le mobile sans toucher au gameplay (cf. cahier
// des charges, section 4).

export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;

    // Plusieurs touches par action pour le confort.
    this.keys = {
      left: [kb.addKey('LEFT'), kb.addKey('A'), kb.addKey('Q')],
      right: [kb.addKey('RIGHT'), kb.addKey('D')],
      jump: [kb.addKey('SPACE'), kb.addKey('UP'), kb.addKey('W'), kb.addKey('Z')],
      attack: [kb.addKey('J'), kb.addKey('X')],
      interact: [kb.addKey('E'), kb.addKey('DOWN'), kb.addKey('S')],
    };

    // État "virtuel" pour le tactile (rempli plus tard par des boutons à l'écran).
    this.virtual = { left: false, right: false, jump: false, attack: false, interact: false };
    this._virtualJumpJustPressed = false;
  }

  _anyDown(list) {
    return list.some((k) => k.isDown);
  }

  _anyJustDown(list) {
    let pressed = false;
    // On appelle JustDown sur chaque touche pour consommer correctement l'état.
    for (const k of list) {
      if (Phaser.Input.Keyboard.JustDown(k)) pressed = true;
    }
    return pressed;
  }

  // -1 (gauche), 0 (rien), 1 (droite)
  getMoveAxis() {
    const left = this._anyDown(this.keys.left) || this.virtual.left;
    const right = this._anyDown(this.keys.right) || this.virtual.right;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  isJumpHeld() {
    return this._anyDown(this.keys.jump) || this.virtual.jump;
  }

  isJumpJustPressed() {
    const kbJust = this._anyJustDown(this.keys.jump);
    const virtJust = this._virtualJumpJustPressed;
    this._virtualJumpJustPressed = false;
    return kbJust || virtJust;
  }

  isAttackJustPressed() {
    return this._anyJustDown(this.keys.attack) || false;
  }

  isInteractJustPressed() {
    return this._anyJustDown(this.keys.interact) || false;
  }

  // --- API destinée aux futurs boutons tactiles ---
  setVirtual(action, value) {
    if (!(action in this.virtual)) return;
    if (action === 'jump' && value && !this.virtual.jump) {
      this._virtualJumpJustPressed = true;
    }
    this.virtual[action] = value;
  }
}
