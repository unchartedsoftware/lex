const { BaseLex } = require('./base-lex');

/**
 * Page Object representing the Simple Tag Lex Example.
 */
exports.SimpleTag = class SimpleTag extends BaseLex {
  constructor (page) {
    super(page);

    this.suggestions = page.locator('li');
  }

  async navigate () {
    await this.page.goto('/tag-field.html');
  }

  async selectHeight () {
    await this.heightToken.click();
  }
};
