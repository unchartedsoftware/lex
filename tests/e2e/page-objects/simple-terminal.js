const { BaseLex } = require('./base-lex');

/**
 * Page Object representing the Simple Number With Units Lex Example.
 */
exports.SimpleTerminal = class SimpleTerminal extends BaseLex {
  constructor (page) {
    super(page);

    this.nameToken = page.locator('li:has-text("Name")');
    this.terminalToken = page.locator('li:has-text("Terminal")');
  }

  async navigate () {
    await this.page.goto('/optionally-terminal-state.html');
  }

  async clickName () {
    await this.nameToken.click();
  }

  async clickTerminal () {
    await this.terminalToken.click();
  }
};
