const { SimpleNumber } = require('./simple-number');

/**
 * Page Object representing the Simple Number With Units Lex Example.
 */
exports.SimpleNumberUnits = class SimpleNumberUnits extends SimpleNumber {
  constructor (page) {
    super(page);

    this.unitSuffix = page.locator('span.token-input > span.text-muted');
  }

  async navigate () {
    await this.page.goto('/simple-number-units.html');
  }
};
