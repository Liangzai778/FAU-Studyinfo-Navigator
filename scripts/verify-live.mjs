import { chromium } from 'playwright';

const BASE = 'https://fau-studyinfo-navigator.pages.dev';
const routes = ['/', '/degree', '/planner', '/exams', '/resources', '/settings'];

const browser = await chromium.launch();

for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(800);
    const title = await page.title();
    const h1 = await page.locator('h1').first().textContent().catch(() => '(no h1)');
    const bodyText = await page.locator('body').innerText();
    const notFound = bodyText.includes('404') || bodyText.includes('not found');
    console.log(`\n${route} -> HTTP ${resp?.status()} | title="${title.trim()}"`);
    console.log(`   h1: ${h1.trim().slice(0, 70)}`);
    console.log(`   chars: ${bodyText.length} | looks404: ${notFound}`);
    if (errors.length) console.log('   ERRORS: ' + JSON.stringify(errors.slice(0, 3)));
  } catch (e) {
    console.log(`\n${route} -> FAILED: ${e.message.slice(0, 100)}`);
  }
  await page.close();
}

await browser.close();
