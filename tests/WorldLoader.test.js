import { describe, it, expect, vi } from 'vitest';
import WorldLoader from '../src/world/WorldLoader.js';

// Scène mock minimale : on vérifie que les bonnes méthodes sont appelées
// avec les bons paramètres, sans toucher à Phaser.
function makeScene() {
  return {
    addGroundSection: vi.fn(),
    addPlatform:      vi.fn(),
    addSlope:         vi.fn(),
    addEnemy:         vi.fn(),
    addCoin:          vi.fn(),
    addCrystal:       vi.fn(),
    add: { text: vi.fn().mockReturnValue({ setOrigin: vi.fn() }) },
  };
}

const theme = { platColor: 0x6655bb };

describe('WorldLoader.build', () => {
  it('appelle addGroundSection pour chaque terrain de type ground', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      terrain: [{ type: 'ground', x: 0, y: 1800, width: 700 }],
    }, theme);
    expect(scene.addGroundSection).toHaveBeenCalledOnce();
    expect(scene.addGroundSection).toHaveBeenCalledWith(0, 1800, 700);
  });

  it('appelle addPlatform (oneWay=true) pour platform', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      terrain: [{ type: 'platform', x: 100, y: 500, width: 200 }],
    }, theme);
    expect(scene.addPlatform).toHaveBeenCalledWith(100, 500, 200, theme.platColor, true);
  });

  it('appelle addPlatform (oneWay=false) pour wall', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      terrain: [{ type: 'wall', x: 50, y: 400, width: 30 }],
    }, theme);
    expect(scene.addPlatform).toHaveBeenCalledWith(50, 400, 30, theme.platColor, false);
  });

  it('appelle addSlope avec les 4 coordonnées', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      terrain: [{ type: 'slope', x1: 700, y1: 1800, x2: 1000, y2: 1650 }],
    }, theme);
    expect(scene.addSlope).toHaveBeenCalledWith(700, 1800, 1000, 1650);
  });

  it('appelle addPlatform avec couleur landmark pour landmark', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      terrain: [{ type: 'landmark', x: 1000, y: 900, width: 240 }],
    }, theme);
    expect(scene.addPlatform).toHaveBeenCalledWith(1000, 900, 240, 0xc06be0, true);
  });

  it('affiche le label si présent sur un landmark', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      terrain: [{ type: 'landmark', x: 1000, y: 900, width: 240, label: 'ARRIVÉE' }],
    }, theme);
    expect(scene.add.text).toHaveBeenCalled();
  });

  it('appelle addEnemy avec les bons paramètres', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      enemies: [{ x: 460, platformTop: 1800, minX: 320, maxX: 600, hp: 2, type: 'walker' }],
    }, theme);
    expect(scene.addEnemy).toHaveBeenCalledWith(460, 1800, 320, 600, { hp: 2, behavior: 'walker' });
  });

  it('appelle addCoin et addCrystal pour chaque collectible', () => {
    const scene = makeScene();
    WorldLoader.build(scene, {
      coins:    [{ x: 100, y: 200 }, { x: 300, y: 400 }],
      crystals: [{ x: 500, y: 600 }],
    }, theme);
    expect(scene.addCoin).toHaveBeenCalledTimes(2);
    expect(scene.addCrystal).toHaveBeenCalledOnce();
  });

  it('ne plante pas avec des tableaux absents (niveau vide)', () => {
    const scene = makeScene();
    expect(() => WorldLoader.build(scene, {}, theme)).not.toThrow();
  });

  it('renvoie les données du niveau', () => {
    const scene = makeScene();
    const data = { terrain: [] };
    const result = WorldLoader.build(scene, data, theme);
    expect(result).toBe(data);
  });
});
