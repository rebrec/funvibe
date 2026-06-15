// Rapport horodaté : exécute tests + build, capture des screenshots du jeu via
// Playwright, et range tout dans tests-output/<horodatage>/.
// Usage : npm run report
//
// Chaque exécution crée un nouveau dossier daté → on peut comparer dans le temps
// et supprimer ceux dont on ne veut plus.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4188;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  return { code: r.status ?? -1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const res = await fetch(url); if (res.ok || res.status === 404) return true; } catch { /* pas prêt */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function main() {
  const ts = stamp();
  const outDir = resolve(ROOT, 'tests-output', ts);
  mkdirSync(outDir, { recursive: true });
  console.log('▶ Rapport :', outDir);

  // 1) Tests
  console.log('  • vitest…');
  const tests = run('npx', ['vitest', 'run']);
  writeFileSync(resolve(outDir, 'vitest.txt'), tests.out);

  // 2) Build
  console.log('  • build…');
  const build = run('npx', ['vite', 'build']);
  writeFileSync(resolve(outDir, 'build.txt'), build.out);

  // 3) Captures via Playwright (best-effort : ne bloque pas le rapport si absent)
  const shots = [];
  let playwrightErr = null;
  let server = null;
  try {
    const { chromium } = await import('playwright');
    server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, shell: process.platform === 'win32' });
    const ready = await waitForServer(`http://localhost:${PORT}/`);
    if (!ready) throw new Error('serveur preview non disponible');

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 960, height: 700 } });

    const capture = async (path, file, waitMs = 1500) => {
      await page.goto(`http://localhost:${PORT}/${path}`, { waitUntil: 'load' });
      await page.waitForTimeout(waitMs);
      await page.screenshot({ path: resolve(outDir, file) });
      shots.push(file);
    };

    await capture('', 'hub.png');
    await capture('preview/', 'sprites.png', 2200);
    await capture('editor/', 'editor.png');

    // Best-effort : entrer dans le niveau (courir à droite vers le portail puis E).
    try {
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      await page.click('canvas');
      // Court jusqu'au portail NIVEAU (au-delà de la boutique) puis E sur place.
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(2550);
      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(150);
      for (let i = 0; i < 4; i++) { await page.keyboard.press('e'); await page.waitForTimeout(90); }
      await page.waitForTimeout(1200);
      await page.keyboard.press('j'); // un coup de poing pour la capture
      await page.waitForTimeout(120);
      await page.screenshot({ path: resolve(outDir, 'level.png') });
      shots.push('level.png');
    } catch (e) {
      console.warn('  ! capture niveau ignorée :', e.message);
    }

    await browser.close();
  } catch (e) {
    playwrightErr = e.message;
    console.warn('  ! captures ignorées :', e.message);
  } finally {
    if (server) server.kill('SIGTERM');
  }

  // 4) Résumé
  const summary = [
    `# Rapport ${ts}`,
    '',
    `- Tests (vitest) : **${tests.code === 0 ? 'OK ✅' : 'ÉCHEC ❌'}** — voir \`vitest.txt\``,
    `- Build (vite)   : **${build.code === 0 ? 'OK ✅' : 'ÉCHEC ❌'}** — voir \`build.txt\``,
    '',
    '## Captures',
    shots.length ? shots.map((s) => `- ![${s}](${s})`).join('\n') : `_aucune_ ${playwrightErr ? `(${playwrightErr})` : ''}`,
    '',
    '## Observations',
    '- Personnages articulés (tête/bras/jambes), animations idle/course/saut/chute/rotation.',
    '- Pentes douces (curve) lissées en spline.',
    '- Niveau démo haut (6000) avec tour verticale + zoom caméra adaptatif.',
    '',
    `> Dossier généré automatiquement par \`npm run report\`. Supprimable à volonté.`,
  ].join('\n');
  writeFileSync(resolve(outDir, 'summary.md'), summary + '\n');

  console.log(`✔ Terminé. tests=${tests.code === 0 ? 'OK' : 'KO'} build=${build.code === 0 ? 'OK' : 'KO'} captures=${shots.length}`);
  process.exit(0);
}

main();
