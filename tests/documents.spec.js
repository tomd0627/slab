import { test, expect } from '@playwright/test';
import { freshPage, createDoc } from './helpers.js';

test.describe('Document management', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
  });

  test('shows welcome screen with no documents', async ({ page }) => {
    await expect(page.locator('#editor-welcome')).toBeVisible();
    await expect(page.locator('#editor-panel')).not.toBeVisible();
    await expect(page.locator('#sidebar-empty')).toBeVisible();
  });

  test('creates a new document and opens the editor', async ({ page }) => {
    await createDoc(page);
    await expect(page.locator('#editor-welcome')).not.toBeVisible();
    await expect(page.locator('#editor-panel')).toBeVisible();
    // Sidebar shows the new untitled doc
    await expect(page.locator('.doc-list__item')).toHaveCount(1);
  });

  test('document title typed in editor appears in sidebar', async ({ page }) => {
    await createDoc(page);
    await page.locator('#doc-title').click();
    await page.locator('#doc-title').type('My Test Doc');
    // Wait for auto-save debounce (500 ms) + a tick
    await page.waitForTimeout(800);
    await expect(page.locator('.doc-list__item-title').first()).toHaveText('My Test Doc');
  });

  test('last-saved indicator updates after save', async ({ page }) => {
    await createDoc(page);
    await page.locator('#doc-title').click();
    await page.locator('#doc-title').type('Hello');
    await page.waitForTimeout(800);
    const saved = page.locator('#last-saved');
    await expect(saved).toContainText('Saved');
  });

  test('deleting active document shows welcome screen', async ({ page }) => {
    await createDoc(page);
    // Dismiss the confirm dialog automatically
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('#delete-doc-btn');
    await expect(page.locator('#editor-panel')).not.toBeVisible();
    await expect(page.locator('#editor-welcome')).toBeVisible();
    await expect(page.locator('.doc-list__item')).toHaveCount(0);
  });

  test('deleting from sidebar removes the item', async ({ page }) => {
    await createDoc(page);
    await page.locator('#doc-title').type('To Delete');
    await page.waitForTimeout(800);

    page.once('dialog', (dialog) => dialog.accept());
    await page.hover('.doc-list__item');
    await page.click('.doc-list__item-delete');
    await expect(page.locator('.doc-list__item')).toHaveCount(0);
  });

  test('can create multiple documents', async ({ page }) => {
    await createDoc(page);
    await page.locator('#doc-title').type('Doc One');
    await page.waitForTimeout(800);

    await createDoc(page);
    await page.locator('#doc-title').type('Doc Two');
    await page.waitForTimeout(800);

    await expect(page.locator('.doc-list__item')).toHaveCount(2);
  });

  test('clicking a sidebar item opens that document', async ({ page }) => {
    await createDoc(page);
    await page.locator('#doc-title').type('First');
    await page.waitForTimeout(800);

    await createDoc(page);
    await page.locator('#doc-title').type('Second');
    await page.waitForTimeout(800);

    // Sidebar is sorted most-recently-saved first; find by title explicitly
    await page.locator('.doc-list__item-btn').filter({ hasText: 'First' }).click();
    await expect(page.locator('#doc-title')).toHaveText('First');
  });
});
