const path = require('path');

const { Liquid } = require('liquidjs');

module.exports = async (browser, parsedData) => {
  const liquid = new Liquid({
    root: path.resolve(__dirname, 'templetes/'),
    extname: '.liquid',
  });
  const renderedStr = await liquid.renderFile('index', parsedData);
  const page = await browser.newPage();
  // await sleep(10000);
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(renderedStr, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({
    path: 'src/templetes/assets/css/bootstrap.min.css',
  });
  await page.addStyleTag({
    path: 'src/templetes/assets/css/style.css',
  });
  const shareImageElementHandle = await page.$('#main');
  const screenshotResult = await shareImageElementHandle.screenshot();
  await page.close();
  return screenshotResult;
};
