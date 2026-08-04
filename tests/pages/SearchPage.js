const BasePage = require('./BasePage');
const { By } = require('selenium-webdriver');

class SearchPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.searchInput = By.css('input[placeholder*="Nhập địa điểm"]');
    this.searchSubmitBtn = By.css('button[type="submit"]');
    this.suggestionsDropdown = By.css('.animate-in button[onmousedown]');
    this.provinceFilter = By.css('select');
    this.postCards = By.css('.grid > a');
  }

  async open() {
    await this.navigateTo('/search');
  }

  async search(keyword) {
    await this.type(this.searchInput, keyword);
    await this.click(this.searchSubmitBtn);
  }

  async selectSuggestion(index = 0) {
    const suggestions = await this.driver.findElements(this.suggestionsDropdown);
    if (suggestions.length > index) {
      await suggestions[index].click();
    }
  }

  async getResultCount() {
    await this.driver.wait(async () => {
      const skeletons = await this.driver.findElements(By.css('.animate-pulse'));
      return skeletons.length === 0;
    }, 10000);
    const cards = await this.driver.findElements(this.postCards);
    return cards.length;
  }
}

module.exports = SearchPage;
