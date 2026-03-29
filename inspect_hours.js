const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://tiptrackerapp.org/tip-entry-form', { waitUntil: 'networkidle' });
  const locator = page.getByText(/Hours Worked/i).first();
  try {
     const html = await locator.evaluate(el => el.parentElement.parentElement.outerHTML);
     console.log(html);
  } catch (e) {
     console.log(e);
  }
  await browser.close();
})();
