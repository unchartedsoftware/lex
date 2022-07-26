const { BaseLex } = require('./base-lex');

/**
 * Page Object representing the Simple Number Lex Example.
 */
exports.SimpleNumber = class SimpleNumber extends BaseLex {
  constructor (page) {
    super(page);
    this.ageToken = page.locator('li:has-text("Age")');
    this.heightToken = page.locator('li:has-text("Height")');
    this.weightToken = page.locator('li:has-text("Weight")');
  }

  async navigate () {
    await this.page.goto('/simple-number.html');
  }

  async selectAgeToken () {
    await this.ageToken.click();
  }

  async selectHeightToken () {
    await this.heightToken.click();
  }

  async selectWeightToken () {
    await this.weightToken.click();
  }

  async fillAgeToken (input) {
    await this.start();
    await this.selectAgeToken();
    await this.inputTextField.fill(input);
    await this.clickFinish();
  }

  async fillHeightToken (input) {
    await this.start();
    await this.selectHeightToken();
    await this.inputTextField.fill(input);
    await this.clickFinish();
  }

  async fillWeightToken (input) {
    await this.start();
    await this.selectWeightToken();
    await this.inputTextField.fill(input);
    await this.clickFinish();
  }
};
