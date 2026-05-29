import { test, expect } from '@playwright/test';
import { freshPage, createDoc } from './helpers.js';

test.describe('Block editor', () => {
  test.beforeEach(async ({ page }) => {
    await freshPage(page);
    await createDoc(page);
  });

  test('new document starts with one empty paragraph block', async ({ page }) => {
    await expect(page.locator('.block')).toHaveCount(1);
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'paragraph');
  });

  test('Enter at end of a block creates a new paragraph', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await block.type('First line');
    await page.keyboard.press('Enter');
    await expect(page.locator('.block')).toHaveCount(2);
    await expect(page.locator('.block').nth(1)).toHaveAttribute('data-block-type', 'paragraph');
  });

  test('Backspace on empty block removes it', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.press('Enter'); // creates second block
    await expect(page.locator('.block')).toHaveCount(2);
    await page.keyboard.press('Backspace');
    await expect(page.locator('.block')).toHaveCount(1);
  });

  test('typing / in empty paragraph opens slash menu', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await expect(page.locator('#slash-menu')).toBeVisible();
    // Should show all block types
    await expect(page.locator('.slash-menu__item')).toHaveCount(8);
  });

  test('slash menu Escape dismisses it without converting', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.keyboard.press('Escape');
    await expect(page.locator('#slash-menu')).not.toBeVisible();
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'paragraph');
  });

  test('slash menu converts block to heading1', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    // Click "Heading 1" in the menu
    await page.locator('.slash-menu__item').filter({ hasText: 'Heading 1' }).click();
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'heading1');
  });

  test('slash menu converts block to code', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Code' }).click();
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'code');
  });

  test('slash menu converts block to checklist', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Checklist' }).click();
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'checklist');
    // Should have a real checkbox
    await expect(page.locator('.block input[type="checkbox"]')).toHaveCount(1);
  });

  test('slash menu converts block to divider', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Divider' }).click();
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'divider');
    await expect(page.locator('.block hr')).toHaveCount(1);
  });

  test('slash menu converts block to callout', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Callout' }).click();
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'callout');
    await expect(page.locator('.block__callout-icon')).toBeVisible();
  });

  test('checklist checkbox toggles checked state', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Checklist' }).click();

    const checkbox = page.locator('.block input[type="checkbox"]');
    await checkbox.check();
    await expect(page.locator('.block').first()).toHaveAttribute('data-checked', 'true');
    await checkbox.uncheck();
    await expect(page.locator('.block').first()).not.toHaveAttribute('data-checked', 'true');
  });

  test('move-up button reorders blocks', async ({ page }) => {
    // Create two blocks: "First" and "Second"
    const firstBlock = page.locator('.block__content').first();
    await firstBlock.click();
    await firstBlock.type('First');
    await page.keyboard.press('Enter');
    await page.locator('.block__content').nth(1).type('Second');

    // Hover to reveal actions, click move-up on second block
    await page.locator('.block').nth(1).hover();
    await page.locator('.block').nth(1).locator('.block__move-up').click();

    // "Second" should now be first
    await expect(page.locator('.block__content').first()).toContainText('Second');
    await expect(page.locator('.block__content').nth(1)).toContainText('First');
  });

  test('move-down button reorders blocks', async ({ page }) => {
    const firstBlock = page.locator('.block__content').first();
    await firstBlock.click();
    await firstBlock.type('First');
    await page.keyboard.press('Enter');
    await page.locator('.block__content').nth(1).type('Second');

    // Hover to reveal actions, click move-down on first block
    await page.locator('.block').first().hover();
    await page.locator('.block').first().locator('.block__move-down').click();

    await expect(page.locator('.block__content').first()).toContainText('Second');
    await expect(page.locator('.block__content').nth(1)).toContainText('First');
  });

  test('inline bold formatting (Ctrl+B)', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await block.type('hello');
    // Select all text in the block then bold it
    // execCommand('bold') produces <b> in Chrome (not <strong>)
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+b');
    await expect(block.locator('b, strong')).toHaveCount(1);
  });

  test('code block uses innerText (no HTML on paste)', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.type('/');
    await page.locator('.slash-menu__item').filter({ hasText: 'Code' }).click();

    const codeContent = page.locator('.block__content').first();
    await codeContent.click();
    // Type plain text — should appear as-is with no HTML wrappers
    await codeContent.type('const x = 1;');
    await expect(codeContent).toHaveText('const x = 1;');
  });

  test('deleting all blocks auto-creates a fresh paragraph', async ({ page }) => {
    const block = page.locator('.block__content').first();
    await block.click();
    await page.keyboard.press('Backspace');
    // Should still have exactly one block
    await expect(page.locator('.block')).toHaveCount(1);
    await expect(page.locator('.block').first()).toHaveAttribute('data-block-type', 'paragraph');
  });
});
