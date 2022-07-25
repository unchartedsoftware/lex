const { BaseLex } = require('./base-lex');

/**
 * Page Object representing the Simple String Lex Example.
 */
exports.SimpleString = class SimpleString extends BaseLex {
  constructor (page) {
    super(page);
    this.nameToken = page.locator('li:has-text("First Name")');
    this.lastNameToken = page.locator('li:has-text("Last Name")');
  }

  async navigate () {
    await this.page.goto('/simple-string.html');
  }

  async selectFirstNameToken () {
    await this.nameToken.click();
  }

  async selectLastNameToken () {
    await this.lastNameToken.click();
  }

  async fillToken (input) {
    await this.start();
    await this.selectFirstNameToken();
    await this.inputTextField.fill(input);
    await this.clickFinish();
  }
};
