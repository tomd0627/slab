import { test, expect } from '@playwright/test';
import { freshPage, createDoc } from './helpers.js';

test.describe('Reading mode', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await createDoc(page);
    await page.locator('#doc-title').type('Read Me');
    await page.locator('.block__content').first().click();
    await page.locator('.block__content').first().type('Some content');
    await page.waitForTimeout(800);
  });

  test('eye button switches to reading mode', async ({ page }) => {
    await page.click('#mode-toggle-btn');
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'read');
  });

  test('toolbar is still visible in reading mode (back button exists)', async ({ page }) => {
    await page.click('#mode-toggle-btn');
    // The mode toggle button must remain visible so the user can exit
    await expect(page.locator('#mode-toggle-btn')).toBeVisible();
  });

  test('delete and sidebar toggle buttons are hidden in reading mode', async ({ page }) => {
    await page.click('#mode-toggle-btn');
    await expect(page.locator('#delete-doc-btn')).not.toBeVisible();
    await expect(page.locator('#toggle-sidebar-btn')).not.toBeVisible();
  });

  test('clicking eye button again exits reading mode', async ({ page }) => {
    await page.click('#mode-toggle-btn');
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'read');

    await page.click('#mode-toggle-btn');
    await expect(page.locator('body')).not.toHaveAttribute('data-mode', 'read');
  });

  test('block content is not editable in reading mode', async ({ page }) => {
    await page.click('#mode-toggle-btn');
    const content = page.locator('.block__content').first();
    await expect(content).toHaveAttribute('contenteditable', 'false');
  });

  test('block actions are hidden in reading mode', async ({ page }) => {
    await page.click('#mode-toggle-btn');
    // Hover the block — actions should NOT appear
    await page.locator('.block').first().hover();
    await expect(page.locator('.block__actions').first()).not.toBeVisible();
  });

  test('drag handles are hidden in reading mode', async ({ page }) => {
    await page.click('#mode-toggle-btn');
    await expect(page.locator('.block__drag-handle').first()).not.toBeVisible();
  });

  test('Ctrl+Shift+R keyboard shortcut toggles reading mode', async ({ page }) => {
    // Focus something in the block list first
    await page.locator('.block__content').first().click();
    await page.keyboard.press('Control+Shift+R');
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'read');
    await page.keyboard.press('Control+Shift+R');
    await expect(page.locator('body')).not.toHaveAttribute('data-mode', 'read');
  });
});

test.describe('Desktop sidebar toggle', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await createDoc(page);
  });

  test('hamburger collapses sidebar on desktop', async ({ page }) => {
    await expect(page.locator('#sidebar')).toBeVisible();
    await page.click('#toggle-sidebar-btn');
    await expect(page.locator('#sidebar')).not.toBeVisible();
  });

  test('hamburger expands sidebar again after collapsing', async ({ page }) => {
    await page.click('#toggle-sidebar-btn');
    await expect(page.locator('#sidebar')).not.toBeVisible();
    await page.click('#toggle-sidebar-btn');
    await expect(page.locator('#sidebar')).toBeVisible();
  });

  test('aria-expanded reflects sidebar state', async ({ page }) => {
    const btn = page.locator('#toggle-sidebar-btn');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Mobile sidebar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('sidebar is open by default when no document exists', async ({ page }) => {
    await freshPage(page);
    await expect(page.locator('#sidebar')).toBeVisible();
  });

  test.describe('with a document open', () => {
    test.beforeEach(async ({ page }) => {
      await freshPage(page);
      await createDoc(page);
    });

    test('sidebar closes when a document is opened', async ({ page }) => {
      await expect(page.locator('#sidebar')).not.toBeVisible();
    });

    test('hamburger re-opens sidebar', async ({ page }) => {
      await page.click('#toggle-sidebar-btn');
      await expect(page.locator('#sidebar')).toBeVisible();
    });

    test('backdrop appears when sidebar is open', async ({ page }) => {
      await page.click('#toggle-sidebar-btn');
      await expect(page.locator('#sidebar-backdrop')).toBeVisible();
    });

    test('clicking backdrop closes sidebar', async ({ page }) => {
      await page.click('#toggle-sidebar-btn');
      // Backdrop covers the full viewport but the 260px sidebar sits on top of the
      // left portion. Click at x=350 to hit the exposed right strip (390px viewport).
      await page.locator('#sidebar-backdrop').click({ position: { x: 350, y: 400 } });
      await expect(page.locator('#sidebar')).not.toBeVisible();
    });
  });
});

test.describe('Share URL', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await createDoc(page);
    await page.locator('#doc-title').type('Shared Doc');
    await page.locator('.block__content').first().click();
    await page.locator('.block__content').first().type('Hello from share');
    await page.waitForTimeout(800);
  });

  test('share button copies a URL with ?doc= parameter', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#share-btn');
    await expect(page.locator('#share-toast')).toBeVisible();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('?doc=');
  });

  test('shared URL opens document in reading mode', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#share-btn');
    const url = await page.evaluate(() => navigator.clipboard.readText());

    // Open shared URL in a new page (no IndexedDB doc)
    const sharedPage = await context.newPage();
    await sharedPage.goto(url);
    await sharedPage.waitForSelector('.app-shell');

    await expect(sharedPage.locator('body')).toHaveAttribute('data-mode', 'read');
    await expect(sharedPage.locator('#share-banner')).toBeVisible();
    await expect(sharedPage.locator('#doc-title')).toContainText('Shared Doc');
  });
});
