import { expect, test, type Page } from '@playwright/test';

async function rejectRemoteRequests(page: Page) {
  const unexpected: string[] = [];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      unexpected.push(url.href);
      await route.abort();
      return;
    }
    await route.continue();
  });
  return unexpected;
}

test('all application routes render without remote requests', async ({ page }) => {
  const unexpected = await rejectRemoteRequests(page);
  for (const path of ['/', '/degree', '/planner', '/exams', '/resources', '/settings', '/legal', '/missing']) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
  }
  expect(unexpected).toEqual([]);
});

test('language, theme, and favorites survive reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换为英文' }).click();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.goto('/resources');
  await page.getByRole('button', { name: 'Add to favorites' }).first().click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove from favorites' }).first()).toBeVisible();
});

test('mobile navigation remains usable at the smallest supported width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: '主导航' });
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: '考试与期限' }).click();
  await expect(page).toHaveURL(/\/exams$/);
  await expect(page.getByRole('heading', { level: 1, name: '考试与期限' })).toBeVisible();
});
