require('dotenv').config({ path: __dirname + '/../.env' });
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function createDriver() {
  const options = new chrome.Options();
  
  // Headless mode configuration
  if (process.env.TEST_HEADLESS === 'true' || process.env.CI === 'true') {
    options.addArguments('--headless=new');
  }
  
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--disable-gpu');
  options.addArguments('--lang=vi-VN');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 30000, script: 30000 });
  return driver;
}

module.exports = { createDriver };
