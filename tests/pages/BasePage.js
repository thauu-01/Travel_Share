const { By, until, Key } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';
    this.defaultTimeout = 10000; // 10s explicit wait
  }

  async navigateTo(relativeUrl = '') {
    const url = `${this.baseUrl}${relativeUrl}`;
    await this.driver.get(url);
  }

  async findElement(locator, timeout = this.defaultTimeout) {
    const byLocator = typeof locator === 'string'
      ? (locator.startsWith('//') || locator.startsWith('./') ? By.xpath(locator) : By.css(locator))
      : locator;
    await this.driver.wait(until.elementLocated(byLocator), timeout);
    const element = await this.driver.findElement(byLocator);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async click(locator, timeout = this.defaultTimeout) {
    const element = await this.findElement(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    await element.click();
  }

  async type(locator, text, timeout = this.defaultTimeout) {
    const element = await this.findElement(locator, timeout);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator, timeout = this.defaultTimeout) {
    const element = await this.findElement(locator, timeout);
    return await element.getText();
  }

  async isDisplayed(locator, timeout = 5000) {
    try {
      const element = await this.findElement(locator, timeout);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async takeScreenshot(filepath) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const image = await this.driver.takeScreenshot();
    fs.writeFileSync(filepath, image, 'base64');
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async waitForUrl(urlSubstring, timeout = this.defaultTimeout) {
    await this.driver.wait(until.urlContains(urlSubstring), timeout);
  }
}

module.exports = BasePage;
