// Persistance simple via localStorage (pièces, cristaux, et plus tard améliorations,
// mondes/maîtrises débloqués...). Tolérant aux erreurs (mode privé, quota, etc.).

const KEY = 'jeuleo.save.v1';
const DEFAULT = { coins: 0, crystals: 0, upgrades: {} };

export default class SaveManager {
  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT };
      return { ...DEFAULT, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULT };
    }
  }

  static save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT, ...data }));
    } catch (e) {
      /* stockage indisponible : on ignore silencieusement */
    }
  }
}
