const BasePage = require('./BasePage');
const { By } = require('selenium-webdriver');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitBtn = By.css('button[type="submit"]');
    this.forgotPasswordLink = By.css('a[href="/forgot-password"]');
  }

  async login(email, password) {
    await this.navigateTo('/login');
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
    await this.driver.wait(async () => {
      const token = await this.driver.executeScript("return localStorage.getItem('token');");
      return !!token;
    }, 10000);
  }

  async forgotPassword(email) {
    await this.navigateTo('/forgot-password');
    await this.type(this.emailInput, email);
    await this.click(this.submitBtn);
    await this.findElement('input[inputmode="numeric"]', 10000);
  }

  async verifyOtpAndResetPassword(otpCode, newPassword) {
    // Fill the 6 OTP input boxes using activeElement focus shifting
    const otpInputs = await this.driver.findElements(By.css('input[inputmode="numeric"]'));
    if (otpInputs.length > 0) {
      await otpInputs[0].click();
      for (let i = 0; i < otpCode.length; i++) {
        await this.driver.switchTo().activeElement().sendKeys(otpCode[i]);
      }
    }
    const verifyBtn = By.xpath('//button[contains(.,"Xác minh OTP")]');
    await this.click(verifyBtn);

    // Step 3: Enter New Password & Confirm Password
    const newPassInput = await this.findElement('input[type="password"]', 10000);
    await newPassInput.clear();
    await newPassInput.sendKeys(newPassword);

    const allPasswordInputs = await this.driver.findElements(By.css('input[type="password"]'));
    if (allPasswordInputs.length > 1) {
      await allPasswordInputs[1].clear();
      await allPasswordInputs[1].sendKeys(newPassword);
    }
    const submitBtn = By.xpath('//button[contains(.,"Xác nhận đặt lại mật khẩu")]');
    await this.click(submitBtn);
  }
}

module.exports = LoginPage;
