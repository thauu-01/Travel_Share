const BasePage = require('./BasePage');
const { By } = require('selenium-webdriver');

class TripPlannerPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.createTripBtn = '//button[contains(., "Tạo lịch trình")]';
    this.tripTitleInput = 'input[placeholder*="Tên lịch trình"]';
    this.tripDescInput = 'textarea[placeholder*="Mô tả"]';
    this.startDateInput = 'input[type="date"]';
    this.submitTripBtn = 'button[type="submit"]';
    this.addDayBtn = '//button[contains(., "Thêm ngày")]';
  }

  async open() {
    await this.navigateTo('/trips');
  }

  async createTrip(title, desc = '') {
    await this.open();
    await this.click(this.createTripBtn);
    await this.type(this.tripTitleInput, title);
    if (desc) await this.type(this.tripDescInput, desc);
    await this.click(this.submitTripBtn);
  }
}

module.exports = TripPlannerPage;
