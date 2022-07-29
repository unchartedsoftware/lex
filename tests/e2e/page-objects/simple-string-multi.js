const { SimpleString } = require('./simple-string');

/**
 * Page Object representing the Simple Multi String Lex Example.
 */
exports.SimpleStringMulti = class SimpleStringMulti extends SimpleString {
  constructor (page) {
    super(page);
    this.copyBtn = page.locator('button:has-text("Copy All")');
    this.clearBtn = page.locator('button:has-text("Clear All")');
    this.badge = page.locator('span.badge');
  }

  async navigate () {
    await this.page.goto('/multi-string.html');
  }

  async clickCopy () {
    await this.copyBtn.click();
  }

  async clickClear () {
    await this.clearBtn.click();
  }

  async fillTokens (...inputs) {
    await this.start();
    await this.selectFirstNameToken();
    for (const input of inputs) {
      await this.inputTextField.fill(input);
      await this.page.keyboard.press('Enter');
    }
  }

  async removeToken (input) {
    await this.page.locator(`li.entered-value:has-text("${input}") > [aria-label=Close]`).click();
  }
};
