import { test, expect } from '@playwright/test';
import { freshPage, createDoc } from './helpers.js';

test.describe('Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
  });

  test('document title survives a page reload', async ({ page }) => {
    await createDoc(page);
    await page.locator('#doc-title').click();
    await page.locator('#doc-title').type('Persisted Title');
    await page.waitForTimeout(800); // wait for auto-save

    await page.reload();
    await page.waitForSelector('.app-shell');

    // Doc should be in sidebar and auto-opened (it was the active doc)
    await expect(page.locator('.doc-list__item')).toHaveCount(1);
    await expect(page.locator('.doc-list__item-title').first()).toHaveText('Persisted Title');
  });

  test('block content survives a page reload', async ({ page }) => {
    await createDoc(page);
    const block = page.locator('.block__content').first();
    await block.click();
    await block.type('Block content here');
    await page.waitForTimeout(800);

    await page.reload();
    await page.waitForSelector('.app-shell');

    // Re-open the document
    await page.locator('.doc-list__item-btn').first().click();
    await expect(page.locator('.block__content').first()).toContainText('Block content here');
  });

  test('multiple block types survive a reload', async ({ page }) => {
    await createDoc(page);

    // Add a heading
    const firstBlock = page.locator('.block__content').first();
    await firstBlock.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Heading 1' }).click();
    await page.locator('.block__content').first().type('My Heading');

    // Add a paragraph
    await page.keyboard.press('Enter');
    await page.locator('.block__content').nth(1).type('Paragraph text');

    await page.waitForTimeout(800);
    await page.reload();
    await page.waitForSelector('.app-shell');
    await page.locator('.doc-list__item-btn').first().click();

    await expect(page.locator('.block').nth(0)).toHaveAttribute('data-block-type', 'heading1');
    await expect(page.locator('.block__content').nth(0)).toContainText('My Heading');
    await expect(page.locator('.block').nth(1)).toHaveAttribute('data-block-type', 'paragraph');
    await expect(page.locator('.block__content').nth(1)).toContainText('Paragraph text');
  });

  test('checked state of checklist survives a reload', async ({ page }) => {
    await createDoc(page);
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Checklist' }).click();
    await page.locator('.block input[type="checkbox"]').check();
    await page.waitForTimeout(800);

    await page.reload();
    await page.waitForSelector('.app-shell');
    await page.locator('.doc-list__item-btn').first().click();

    await expect(page.locator('.block input[type="checkbox"]')).toBeChecked();
  });

  test('multiple documents persist across reload', async ({ page }) => {
    await createDoc(page);
    await page.locator('#doc-title').type('Doc Alpha');
    await page.waitForTimeout(800);

    await createDoc(page);
    await page.locator('#doc-title').type('Doc Beta');
    await page.waitForTimeout(800);

    await page.reload();
    await page.waitForSelector('.app-shell');

    await expect(page.locator('.doc-list__item')).toHaveCount(2);
  });
});
