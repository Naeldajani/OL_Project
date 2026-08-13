const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errors = [];
  const base = 'http://localhost:4173/lugdunhome.html#';
  const routes = [['/', 'm-home'], ['/matchs/4635311', 'm-match'], ['/pronos', 'm-pronos']];
  for (const [route, name] of routes) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 1500 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    await page.goto(base + route, { waitUntil: 'load' });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `/tmp/frames/${name}.png` });
    await page.close();
  }
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})();
