const { BaseLex } = require('./base-lex');

/**
 * Page Object representing the Simple Number With Units Lex Example.
 */
exports.DateTime = class DateTime extends BaseLex {
  constructor (page) {
    super(page);

    this.dateToken = page.locator('li:has-text("Date") >> nth=0');
    this.timeToken = page.locator('li:has-text("Time") >> nth=0');
    this.dateTimeToken = page.locator('li:has-text("DateTime") >> nth=0');
    this.dateTime24Token = page.locator('li:has-text("DateTime 24hr")');

    this.equalsToken = page.locator('li:has-text("equals")');
    this.notEqualsToken = page.locator('li:has-text("does not equal")');
    this.beforeToken = page.locator('li:has-text("before")');
    this.afterToken = page.locator('li:has-text("after")');
    this.betweenToken = page.locator('li:has-text("between")');

    this.visEqual = page.locator('text==');
    this.visNotEqual = page.locator('text=≠');
    this.visBefore = page.locator('text=<');
    this.visAfter = page.locator('span.token-input:has-text(">")');
    this.visBetween = page.locator('text=between');

    this.calendar = page.locator('div.flatpickr-calendar');
  }

  async navigate () {
    await this.page.goto('/datetime-picker.html');
  }

  async clickDate () {
    await this.dateToken.click();
  }

  async clickTime () {
    await this.timeToken.click();
  }

  async clickDateTime () {
    await this.dateTimeToken.click();
  }

  async clickDateTime24 () {
    await this.dateTime24Token.click();
  }

  async clickEquals () {
    await this.equalsToken.click();
  }

  async clickNotEqual () {
    await this.notEqualsToken.click();
  }

  async clickBefore () {
    await this.beforeToken.click();
  }

  async clickAfter () {
    await this.afterToken.click();
  }

  async clickBetween () {
    await this.betweenToken.click();
  }
};
