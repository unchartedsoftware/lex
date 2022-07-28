const { BaseLex } = require('./base-lex');

/**
 * Page Object representing the Simple Label Lex Example.
 */
exports.SimpleLabel = class SimpleLabel extends BaseLex {
  constructor (page) {
    super(page);

    this.heightToken = page.locator('li:has-text("Height")');
    this.labelToken = page.locator('span.token-input:has-text("and")');
  }

  async navigate () {
    await this.page.goto('/simple-label.html');
  }

  async selectHeight () {
    await this.heightToken.click();
  }
};
