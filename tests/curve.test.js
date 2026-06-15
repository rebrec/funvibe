import { describe, it, expect } from 'vitest';
import { smoothCurve } from '../src/world/curve.js';

describe('smoothCurve', () => {
  const pts = [{ x: 0, y: 0 }, { x: 100, y: -50 }, { x: 200, y: 0 }];

  it('produit (N-1)*segPerSpan + 1 points', () => {
    expect(smoothCurve(pts, 8)).toHaveLength((pts.length - 1) * 8 + 1);
    expect(smoothCurve(pts, 4)).toHaveLength((pts.length - 1) * 4 + 1);
  });

  it('passe exactement par les extrémités', () => {
    const out = smoothCurve(pts, 8);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[out.length - 1]).toEqual({ x: 200, y: 0 });
  });

  it('ne renvoie que des coordonnées finies', () => {
    for (const p of smoothCurve(pts, 8)) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('reste robuste avec moins de 2 points', () => {
    expect(smoothCurve([], 8)).toEqual([]);
    expect(smoothCurve([{ x: 5, y: 5 }], 8)).toEqual([{ x: 5, y: 5 }]);
  });

  it('la crête monte bien entre les points de contrôle (y négatif au milieu)', () => {
    const out = smoothCurve(pts, 8);
    const mid = out[Math.floor(out.length / 2)];
    expect(mid.y).toBeLessThan(0);
  });
});
