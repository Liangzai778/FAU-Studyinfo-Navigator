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

test('a course and a personal plan survive a reload', async ({ page }) => {
  // A course needs a confirmed programme/PO before the catalogue is usable.
  await page.goto('/degree');
  await page.locator('select').nth(0).selectOption('master');
  await page.locator('select').nth(1).selectOption('nat');
  await page.locator('select').nth(2).selectOption('nat-biologie-zell-molekularbiologie-msc');
  await page.getByLabel('入学年份').fill('2026');
  await page.getByLabel('选择学期').selectOption('winter');
  await page.getByLabel('PO 版本', { exact: true }).selectOption('po-zmb-2026');
  await page.getByRole('checkbox').last().check();
  await page.getByRole('button', { name: '保存专业与 PO' }).click();
  await expect(page.getByText('专业与 PO 组合已保存')).toBeVisible();

  await page.goto('/planner');
  await page.getByLabel('手动录入其他课程').check();
  await page.getByLabel('课程名称').fill('E2E persistence course');
  await page.getByLabel('ECTS', { exact: true }).fill('5');
  await page.getByLabel('学期年份').fill('2026');
  await page.getByLabel('学期类型').selectOption('winter');
  await page.getByRole('button', { name: '添加到计划' }).click();
  await expect(page.getByText('E2E persistence course').first()).toBeVisible();

  const form = page.locator('#calendar-event-form');
  await form.getByLabel('事由').fill('E2E personal plan');
  await form.getByLabel('日期').fill('2026-10-20');
  await form.getByRole('button', { name: '保存日程' }).click();
  await expect(page.getByText('E2E personal plan').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('E2E persistence course').first()).toBeVisible();
  await expect(page.getByText('E2E personal plan').first()).toBeVisible();
});

test('calendar moves by month and returns to today', async ({ page }) => {
  await page.goto('/planner');
  const calendar = page.locator('section', { has: page.getByRole('heading', { name: '学期日历' }) }).first();
  await expect(calendar).toBeVisible();
  const title = calendar.getByText(/\d{4}年\d{1,2}月|\w+ \d{4}/).first();
  const before = await title.innerText();
  await page.getByRole('button', { name: '下个月' }).click();
  await expect(title).not.toHaveText(before);
  await page.getByRole('button', { name: '上个月' }).click();
  await expect(title).toHaveText(before);
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
