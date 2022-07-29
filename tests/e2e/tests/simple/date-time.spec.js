const { test, expect } = require('@playwright/test');
const { DateTime } = require('../../page-objects/date-time');

test.describe.parallel('DateTime Test Lex Bar', () => {
  let dateTime;

  test.beforeEach(async ({ page }) => {
    dateTime = new DateTime(page);
    await dateTime.navigate();
  });

  test('should be invalid if no token or missing value', async () => {
    await dateTime.start();
    const inputField = await dateTime.inputTextField;
    await expect(inputField).toHaveClass(/active/);

    // fail on no token selected
    await dateTime.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');

    // fail on bad token
    await inputField.fill('abc');
    await dateTime.clickNext();
    await expect(inputField).toHaveClass(/invalid/);
    await expect(inputField).toHaveCSS('background-color', 'rgb(226, 164, 164)');
  });

  test('should have all options available', async () => {
    await dateTime.start();

    await expect(dateTime.dateToken).toBeVisible();
    await expect(dateTime.timeToken).toBeVisible();
    await expect(dateTime.dateTimeToken).toBeVisible();
    await expect(dateTime.dateTime24Token).toBeVisible();
  });

  test('should have all modifier options', async () => {
    await dateTime.start();
    await dateTime.clickDate();

    await expect(dateTime.equalsToken).toBeVisible();
    await expect(dateTime.notEqualsToken).toBeVisible();
    await expect(dateTime.beforeToken).toBeVisible();
    await expect(dateTime.afterToken).toBeVisible();
    await expect(dateTime.betweenToken).toBeVisible();
  });

  test('should have appropriate modifier icon when selected', async () => {
    await dateTime.start();
    await dateTime.clickDate();

    // equals
    await dateTime.clickEquals();
    await expect(dateTime.visEqual).toBeVisible();
    await expect(dateTime.calendar).toBeVisible();
    await expect(dateTime.page.locator('[placeholder="YYYY/MM/DD"]')).toBeVisible();
    await dateTime.visEqual.click();

    // not equal
    await dateTime.clickNotEqual();
    await expect(dateTime.visNotEqual).toBeVisible();
    await expect(dateTime.calendar).toBeVisible();
    await dateTime.visNotEqual.click();

    // before
    await dateTime.clickBefore();
    await expect(dateTime.visBefore).toBeVisible();
    await expect(dateTime.calendar).toBeVisible();
    await dateTime.visBefore.click();

    // after
    await dateTime.clickAfter();
    await expect(dateTime.visAfter).toBeVisible();
    await expect(dateTime.calendar).toBeVisible();
    await dateTime.visAfter.click();

    // between
    await dateTime.clickBetween();
    await expect(dateTime.visBetween).toBeVisible();
    await expect(dateTime.calendar).toBeVisible();
    await dateTime.visBetween.click();
  });

  test('should have only time', async () => {
    await dateTime.start();
    await dateTime.clickTime();
    await dateTime.clickEquals();
    await expect(dateTime.calendar).toBeVisible();
    await expect(dateTime.calendar).toHaveClass(/hasTime noCalendar/);
    await expect(dateTime.page.locator('[placeholder="h:mm:ss a"]')).toBeVisible();
  });

  test('should have both time and calendar', async () => {
    await dateTime.start();
    await dateTime.clickDateTime();
    await dateTime.clickEquals();
    await expect(dateTime.calendar).toBeVisible();
    await expect(dateTime.calendar).toHaveClass(/hasTime/);
    await expect(dateTime.calendar).not.toHaveClass(/ noCalendar/);
    await expect(dateTime.page.locator('[placeholder="YYYY/MM/DD h:mm:ss a"]')).toBeVisible();
  });

  test('should have both time (24hr) and calendar', async () => {
    await dateTime.start();
    await dateTime.clickDateTime24();
    await dateTime.clickEquals();
    await expect(dateTime.calendar).toBeVisible();
    await expect(dateTime.calendar).toHaveClass(/hasTime/);
    await expect(dateTime.calendar).not.toHaveClass(/ noCalendar/);
    await expect(dateTime.page.locator('[placeholder="YYYY/MM/DD HH:mm:ss"]')).toBeVisible();
  });
});
