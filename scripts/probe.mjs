import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const resp = await page.goto('https://fau-studyinfo-navigator.pages.dev/degree', {
  waitUntil: 'domcontentloaded',
});
console.log('status:', resp.status());
const headers = resp.headers();
for (const [k, v] of Object.entries(headers)) {
  if (/^(server|cf-|content-type|location|date)/.test(k)) console.log(`  ${k}: ${v}`);
}
console.log('\ntitle:', await page.title());
const body = await page.locator('body').innerText();
console.log('body starts:', JSON.stringify(body.slice(0, 120)));
await browser.close();
