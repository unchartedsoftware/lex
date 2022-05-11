const { test, expect } = require('@playwright/test');
const { SimpleString } = require('../../page-objects/SimpleString');

test.describe.parallel('Simple String Lex Bar', () => {
  let simpleString;

  test.beforeEach(async ({ page }) => {
    simpleString = new SimpleString(page);
    await simpleString.navigate();
  });

  test('should be invalid if no token or missing value', async () => {
    await simpleString.start();
    const inputField = await simpleString.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on no token selected
    await simpleString.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on no value entered
    await simpleString.selectFirstNameToken();
    await simpleString.clickFinish();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should be valid', async () => {
    await simpleString.fillToken('Bob');

    const btn = await simpleString.closeBtn;
    await expect(btn).toBeVisible();
    await expect(btn).toHaveClass(/token-remove/);
  });

  test('should be able to remove pill', async () => {
    // Remove incomplete pill
    await simpleString.start();
    await simpleString.clickCancel();

    // validate that the pill is removed
    await expect(simpleString.tokenContainer).not.toBeVisible();
  });

  test('should be able to remove completed pill', async () => {
    await simpleString.fillToken('Bob');
    await simpleString.clickClose();
    await expect(simpleString.tokenContainer).not.toBeVisible();
  });
});
