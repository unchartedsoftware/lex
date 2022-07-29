const { test, expect } = require('@playwright/test');
const { SimpleTag } = require('../../page-objects/simple-tag');

test.describe.parallel('Tag Test Lex Bar', () => {
  let tagPO;

  test.beforeEach(async ({ page }) => {
    tagPO = new SimpleTag(page);
    await tagPO.navigate();
  });

  test('should be invalid if no token or missing value(s)', async () => {
    await tagPO.start();
    const inputField = await tagPO.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on no token selected
    await tagPO.clickFinish();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should see suggestions', async () => {
    await tagPO.start();
    const inputField = await tagPO.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fill input with just f for suggestions
    await inputField.type('f');
    await expect(tagPO.suggestions).toHaveCount(2);
  });

  test('should see no suggestions on no entry', async () => {
    await tagPO.start();
    const inputField = await tagPO.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    await expect(tagPO.suggestions).not.toBeVisible();
    await expect(tagPO.suggestions).toHaveCount(0);
  });

  test('should see no suggestions on entryies with no match', async () => {
    await tagPO.start();
    const inputField = await tagPO.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // enter non matching value
    await inputField.type('x');
    await expect(tagPO.suggestions).not.toBeVisible();
    await expect(tagPO.suggestions).toHaveCount(0);
  });
});
