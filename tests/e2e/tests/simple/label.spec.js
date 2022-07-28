const { test, expect } = require('@playwright/test');
const { SimpleLabel } = require('../../page-objects/simple-label');

test.describe.parallel('Label Test Lex Bar', () => {
  let labelPO;

  test.beforeEach(async ({ page }) => {
    labelPO = new SimpleLabel(page);
    await labelPO.navigate();
  });

  test('should be invalid if no token or missing value(s)', async () => {
    await labelPO.start();
    const inputField = await labelPO.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on no token selected
    await labelPO.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on just the type selected
    await labelPO.selectHeight();
    await labelPO.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on bad token
    await inputField.fill('abc');
    await labelPO.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on missing 2nd token
    await inputField.fill('1');
    // TODO: bug this fails, after an error is made it does not reset and the button is not properly triggering even with correct value
    // await labelPO.clickNext();
    await labelPO.page.keyboard.press('Enter');

    await expect(labelPO.labelToken).toBeVisible();
    await labelPO.clickFinish();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should be valid entry with visible label between', async () => {
    await labelPO.start();
    const inputField = await labelPO.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on just the type selected
    await labelPO.selectHeight();
    // fail on missing 2nd token
    await inputField.fill('1');
    await labelPO.clickNext();

    await expect(labelPO.labelToken).toBeVisible();
    await inputField.fill('2');
    await labelPO.clickFinish();

    await expect(labelPO.labelToken).toBeVisible();
    await expect(inputField).not.toBeVisible();
  });
});
