/**
 * Navigate to the app, clear all IndexedDB entries via idbKeyval.clear()
 * (avoids the deleteDatabase blocking issue caused by open connections),
 * then reload so the app starts with a fresh empty state.
 *
 * Does NOT use addInitScript, so subsequent reloads within a test
 * will NOT clear the DB again — persistence tests work correctly.
 */
export async function freshPage(page) {
  await page.goto('/');
  await page.waitForSelector('.app-shell');
  // idbKeyval.clear() works on the live connection — no blocking
  await page.evaluate(() => window.idbKeyval.clear());
  await page.reload();
  await page.waitForSelector('.app-shell');
}

/**
 * Create a new document and wait for the editor to open.
 * On mobile the sidebar auto-opens on init, so new-doc-btn is always reachable.
 */
export async function createDoc(page) {
  await page.click('#new-doc-btn');
  await page.waitForSelector('#editor-panel:not([hidden])');
}

/**
 * Type text into the first block content area.
 */
export async function typeInFirstBlock(page, text) {
  const block = page.locator('.block__content').first();
  await block.click();
  await block.type(text);
}
