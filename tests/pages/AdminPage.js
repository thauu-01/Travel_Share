const BasePage = require('./BasePage');
const { By } = require('selenium-webdriver');

class AdminPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.usersTab = By.css('a[href="/admin/users"]');
    this.postsTab = By.css('a[href="/admin/posts"]');
    this.userRows = By.css('tbody tr');
  }

  async openUsersTab() {
    await this.navigateTo('/admin/users');
  }

  async isDemoteButtonDisabledForSelf() {
    await this.openUsersTab();
    const selfBadge = await this.findElement("//span[contains(.,'Bạn')]", 15000);
    const row = await selfBadge.findElement(By.xpath('./ancestor::tr'));
    const demoteBtn = await row.findElement(By.xpath('.//button[contains(.,"Hạ quyền")]'));
    const isDisabled = await demoteBtn.getAttribute('disabled');
    return isDisabled !== null;
  }
}

module.exports = AdminPage;
