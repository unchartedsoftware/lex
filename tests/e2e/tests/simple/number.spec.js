const { test, expect } = require('@playwright/test');
const { SimpleNumber } = require('../../page-objects/simple-number');

test.describe.parallel('Simple Number Lex Bar', () => {
  let simpleNumber;

  test.beforeEach(async ({ page }) => {
    simpleNumber = new SimpleNumber(page);
    await simpleNumber.navigate();
  });

  test('should be invalid if no token or missing value', async () => {
    await simpleNumber.start();
    const inputField = await simpleNumber.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on no token selected
    await simpleNumber.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on no value entered
    await simpleNumber.selectAgeToken();
    await simpleNumber.clickFinish();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should be valid', async () => {
    await simpleNumber.fillAgeToken('21');

    const btn = await simpleNumber.closeBtn;
    await expect(btn).toBeVisible();
    await expect(btn).toHaveClass(/token-remove/);
  });

  test('should be invalid when not a number', async () => {
    await simpleNumber.fillAgeToken('Bob');

    const btn = await simpleNumber.finishBtn;
    await expect(btn).toBeVisible();
    const inputField = await simpleNumber.inputTextField;
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should be able to remove pill', async () => {
    // Remove incomplete pill
    await simpleNumber.start();
    await simpleNumber.clickCancel();

    // validate that the pill is removed
    await expect(simpleNumber.tokenContainer).not.toBeVisible();
  });

  test('should be able to remove completed pill', async () => {
    await simpleNumber.fillAgeToken('21');
    await simpleNumber.clickClose();
    await expect(simpleNumber.tokenContainer).not.toBeVisible();
  });
});
