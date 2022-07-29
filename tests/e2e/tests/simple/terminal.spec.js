const { test, expect } = require('@playwright/test');
const { SimpleTerminal } = require('../../page-objects/simple-terminal');

test.describe.parallel('Terminal Test Lex Bar', () => {
  let terminal;

  test.beforeEach(async ({ page }) => {
    terminal = new SimpleTerminal(page);
    await terminal.navigate();
  });

  test('should be invalid if no token or missing value', async () => {
    await terminal.start();
    const inputField = await terminal.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on no token selected
    await terminal.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on bad token
    await inputField.fill('abc');
    await terminal.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should be valid with immediate terminal', async () => {
    await terminal.clickTerminal();

    const btn = await terminal.closeBtn;
    await expect(btn).toBeVisible();
    await expect(btn).toHaveClass(/token-remove/);

    await expect(terminal.nextBtn).not.toBeVisible();
  });

  test('should not immediately terminate if not terminal', async () => {
    await terminal.clickName();

    await expect(terminal.finishBtn).toBeVisible();
  });

  test('should be able to remove pill', async () => {
    // Remove incomplete pill
    await terminal.clickTerminal();
    await terminal.clickClose();

    // validate that the pill is removed
    await expect(terminal.tokenContainer).not.toBeVisible();
  });
});
