/**
 * Page Object representing the basic Lex components.
 */
exports.BaseLex = class BaseLex {
  constructor (page) {
    this.page = page;
    this.lexBox = page.locator('.lex-box');
    this.inputTextField = page.locator('input[type="text"]');
    this.closeBtn = page.locator('[aria-label="Close"]');
    this.finishBtn = page.locator('[aria-label="Finish"]');
    this.nextBtn = page.locator('[aria-label="Next"]');
    this.cancelBtn = page.locator('[aria-label="Cancel New Token"]');
    this.cancelEditBtn = page.locator('[aria-label="Cancel Edits"]');
    this.tokenContainer = page.locator('div.token-container');
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

  async inputText (input) {
    await this.inputTextField.type(input);
  }

  /**
   * Retrieves the OS being used by the browser.
   * NOTE: This does not mean it is the machine OS however.
   *
   * @returns OS Platform.
   */
  async getBrowserOs () {
    const response = String(
      await this.page.evaluate(() => {
        return navigator.userAgent;
      })
    );
    if (response.indexOf('Win') !== -1) return 'Windows';
    if (response.indexOf('Mac') !== -1) return 'MacOS';
    if (response.indexOf('X11') !== -1) return 'Unix';
    if (response.indexOf('Linux') !== -1) return 'Linux';
  }

  /**
   * Retrieves the platfrom of the user agent used.
   *
   * @returns OS Platform.
   */
  async getOs () {
    const response = String(
      await this.page.evaluate(() => {
        return navigator.platform;
      })
    );
    if (response.indexOf('Win') !== -1) return 'Windows';
    if (response.indexOf('Mac') !== -1) return 'MacOS';
    if (response.indexOf('X11') !== -1) return 'Unix';
    if (response.indexOf('Linux') !== -1) return 'Linux';
  }
};
