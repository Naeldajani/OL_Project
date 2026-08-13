const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 2100 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4173/lugdunhome.html#/joueur/' + encodeURIComponent('Corentin Tolisso'), { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: '/tmp/frames/lh-player.png' });
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})();
