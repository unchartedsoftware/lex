const { test, expect } = require('@playwright/test');
const { SimpleStringMulti } = require('../../page-objects/simple-string-multi');

test.describe.parallel('Multi String Lex Bar', () => {
  let multiString;

  test.beforeEach(async ({ page }) => {
    multiString = new SimpleStringMulti(page);
    await multiString.navigate();
  });

  test('should be invalid if no token or missing value', async () => {
    await multiString.start();
    const inputField = await multiString.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on no token selected
    await multiString.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on no value entered
    await multiString.selectFirstNameToken();
    await multiString.clickFinish();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should be able to remove pill', async () => {
    // Remove incomplete pill
    await multiString.start();
    await multiString.clickCancel();

    // validate that the pill is removed
    await expect(multiString.tokenContainer).not.toBeVisible();
  });

  test('should be able to enter multiple values', async () => {
    await multiString.fillTokens('Bob', 'Jim');
    await multiString.clickFinish();
    await expect(multiString.page.locator('text=Jim & 1 others')).toBeVisible();
  });

  test('should have badge representing proper count', async () => {
    await multiString.fillTokens('Bob', 'Jim', 'Fred');
    await expect(multiString.badge).toContainText('3');

    // remove value and check badge
    await multiString.removeToken('Jim');
    await expect(multiString.badge).toContainText('2');
  });

  test('should clear all tokens', async () => {
    await multiString.fillTokens('Bob', 'Jim', 'Fred');
    await expect(multiString.badge).toContainText('3');

    await multiString.clickClear();
    await expect(multiString.badge).toContainText('0');
    await expect(multiString.page.locator('div.multivalue-list')).toBeEmpty();
  });

  // TODO: OS issues with clipboard, revist in Playwright v1.24 as there are improvements coming
  test.skip('should be able to copy all tokens', async () => {
    await multiString.fillTokens('Bob', 'Jim', 'Fred');
    await expect(multiString.badge).toContainText('3');
    await multiString.clickCopy();

    // clear all tokens
    await multiString.clickClear();
    await expect(multiString.badge).toContainText('0');

    // paste
    const modifier = await multiString.getOs() === 'MacOS' ? 'Meta' : 'Control';
    await multiString.page.keyboard.press(`${modifier}+KeyV`);
    await expect(multiString.badge).toContainText('3');
  });
});
