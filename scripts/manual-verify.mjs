// Manual acceptance sweep: visits every route at three viewports, captures
// screenshots, and fails loudly on console errors or blank pages.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://127.0.0.1:5173';
const ROUTES = ['/', '/degree', '/planner', '/exams', '/resources', '/settings', '/missing'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

await mkdir('verification-shots', { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[${vp.name}] console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[${vp.name}] pageerror: ${err.message}`));

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    const heading = await page.locator('main h1').first().textContent({ timeout: 5000 }).catch(() => null);
    const visible = await page.locator('main h1').first().isVisible().catch(() => false);
    if (!visible) problems.push(`[${vp.name}] ${route}: no visible h1`);
    const slug = route === '/' ? 'dashboard' : route.replace('/', '');
    await page.screenshot({ path: `verification-shots/${vp.name}-${slug}.png`, fullPage: true });
    console.log(`${vp.name.padEnd(8)} ${route.padEnd(12)} h1="${(heading ?? '').trim()}"`);
  }

  await context.close();
}

await browser.close();

if (problems.length) {
  console.error('\nPROBLEMS:');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log('\nAll routes rendered with no console errors.');
