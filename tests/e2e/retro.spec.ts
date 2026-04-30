import { test, expect, type BrowserContext, type Page } from '@playwright/test';

test('two browsers — card realtime sync, voting, anon, end', async ({ browser }) => {
  const a: BrowserContext = await browser.newContext();
  const b: BrowserContext = await browser.newContext();
  const pa: Page = await a.newPage();
  const pb: Page = await b.newPage();

  // Alice creates room
  await pa.goto('/');
  await pa.getByLabel('Your name').fill('Alice');
  await pa.getByRole('button', { name: /create room/i }).click();
  await pa.waitForURL(/\/r\/\d{6}/);
  const code = pa.url().match(/\/r\/(\d{6})/)![1];

  // Bob joins
  await pb.goto(`/r/${code}/join`);
  await pb.getByLabel('Your name').fill('Bob');
  await pb.getByRole('button', { name: /join/i }).click();
  await pb.waitForURL(`/r/${code}`);

  // Alice adds a card
  await pa.getByRole('button', { name: /Add card to Mad/i }).click();
  await pa.getByRole('textbox').fill('CI is broken');
  await pa.getByRole('button', { name: /save/i }).click();

  // Bob sees it within 2s
  await expect(pb.getByText('CI is broken')).toBeVisible({ timeout: 2000 });

  // Bob votes
  const bobCard = pb.getByText('CI is broken').locator('..');
  await bobCard.getByRole('button', { name: /add vote/i }).click();

  // Alice sees vote tally update
  const aliceCard = pa.getByText('CI is broken').locator('..');
  await expect(aliceCard.getByLabel(/vote total/i)).toContainText('1', { timeout: 2000 });

  // Anon mode by facilitator (Alice)
  await pa.getByLabel(/anonymous cards/i).check();
  await expect(pb.getByText('Anonymous')).toBeVisible({ timeout: 2000 });
  // Alice still sees her own name
  await expect(pa.getByText('Alice', { exact: false })).toBeVisible();

  // End retro
  pa.once('dialog', (d) => d.accept());
  await pa.getByRole('button', { name: /end retro/i }).click();
  await expect(pb.getByText(/this retro has ended/i)).toBeVisible({ timeout: 2000 });

  await a.close();
  await b.close();
});
