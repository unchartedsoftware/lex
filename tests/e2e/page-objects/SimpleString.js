/**
 * Page Object representing the SimpleString Lex Example
 */
exports.SimpleString = class SimpleString {
  constructor (page) {
    this.page = page;
    this.nameToken = page.locator('text=First Name');
    this.lexBox = page.locator('.lex-box');
    this.inputTextField = page.locator('input[type="text"]');
    this.closeBtn = page.locator('[aria-label="Close"]');
    this.finishBtn = page.locator('[aria-label="Finish"]');
    this.nextBtn = page.locator('[aria-label="Next"]');
    this.cancelBtn = page.locator('[aria-label="Cancel New Token"]');
    this.tokenContainer = page.locator('div.token-container');
  }

  async navigate () {
    await this.page.goto('/simple-string.html');
  }

  async start () {
    await this.lexBox.click();
  }

  async clickFinish () {
    await this.finishBtn.click();
  }

  async clickNext () {
    await this.nextBtn.click();
  }

  async clickClose () {
    await this.closeBtn.click();
  }

  async clickCancel () {
    await this.cancelBtn.click();
  }

  async selectFirstNameToken () {
    await this.nameToken.click();
  }

  async fillToken (input) {
    await this.start();
    await this.selectFirstNameToken();
    await this.inputTextField.fill(input);
    await this.clickFinish();
  }
};
