import { describe, it, expect } from 'vitest';
import { getTheme, THEMES, PLAYER_SKINS, ENEMY_WALKER_SKINS, ENEMY_CHARGER_SKINS } from '../src/core/Skins.js';

describe('getTheme', () => {
  it('retourne un objet thème valide pour chaque thème connu', () => {
    for (const name of THEMES) {
      const t = getTheme(name);
      expect(t).toBeDefined();
      expect(t.background).toBeDefined();
      expect(typeof t.platColor).toBe('number');
      expect(typeof t.groundTop).toBe('number');
      expect(typeof t.groundBody).toBe('number');
      expect(typeof t.slopeColor).toBe('number');
      expect(typeof t.decorFn).toBe('string');
    }
  });

  it('retourne forest par défaut pour un thème inconnu', () => {
    const t = getTheme('inexistant');
    expect(t).toEqual(getTheme('forest'));
  });

  it('a bien 4 thèmes', () => {
    expect(THEMES).toHaveLength(4);
    expect(THEMES).toContain('forest');
    expect(THEMES).toContain('snow');
    expect(THEMES).toContain('sea');
    expect(THEMES).toContain('volcano');
  });
});

describe('Skins lists', () => {
  it('PLAYER_SKINS contient au moins un skin', () => {
    expect(PLAYER_SKINS.length).toBeGreaterThanOrEqual(1);
    expect(PLAYER_SKINS).toContain('ninja');
  });

  it('ENEMY_WALKER_SKINS et ENEMY_CHARGER_SKINS sont définis', () => {
    expect(ENEMY_WALKER_SKINS.length).toBeGreaterThanOrEqual(1);
    expect(ENEMY_CHARGER_SKINS.length).toBeGreaterThanOrEqual(1);
  });
});
