const express = require('express');
const puppeteer = require('puppeteer');
const pino = require('pino');
const path = require('path');
const { Liquid } = require('liquidjs');

const log = pino({ name: 'Server', prettyPrint: true });
const app = express();
const port = process.env.PORT ?? 3000;
const engine = new Liquid();
let browser = null;

const parseCafePost = require('./parseCafePost');
const createCafeShareImage = require('./createCafeShareImage');

app.engine('liquid', engine.express());
app.set('views', path.resolve(__dirname, 'templetes/'));
app.set('view engine', 'liquid');

function getShareInfo(req, res, next) {
  const { cafeName, postID } = req.params;
  const imageIndex = req.query.i ?? 0;
  req.shareInfo = { cafeName, postID, imageIndex };
  next();
}

async function generateShareImage(req, res, next) {
  log.info('generateShareImage');
  if (!browser || browser.process().killed) {
    log.warn('Browser closed!');
    browser = await puppeteer.launch({ headless: true });
  }
  const { cafeName, postID, imageIndex } = req.shareInfo;
  log.info(`Image: ${cafeName} / ${postID} / ${imageIndex}`);
  const parsedData = await parseCafePost(cafeName, postID, imageIndex);
  const shareImage = await createCafeShareImage(
    browser,
    parsedData,
    cafeName,
    postID
  );
  log.info('Image Created!');
  res.shareImage = shareImage;
  next();
}

app.get('/s/:cafeName/:postID', getShareInfo, async (req, res) => {
  const { cafeName, postID, imageIndex } = req.shareInfo;
  log.info(`Share: ${cafeName} / ${postID} / ${imageIndex}`);
  const redirectURL = `https://cafe.naver.com/${cafeName}/${postID}`;
  const imageURL = `${req.protocol}://${req.hostname}/img/${cafeName}/${postID}`;
  const parsedData = await parseCafePost(cafeName, postID, imageIndex);
  res.render('share', { imageURL, redirectURL, ...parsedData });
});

app.get(
  '/img/:cafeName/:postID',
  getShareInfo,
  generateShareImage,
  async (req, res) => {
    res.status(200);
    res.type('png');
    res.send(res.shareImage);
  }
);

app.get('/info/:cafeName/:postID', getShareInfo, async (req, res) => {
  const { cafeName, postID } = req.params;
  const imageIndex = req.query.img_index ?? 0;
  log.info(`Info: ${cafeName} / ${postID} / ${imageIndex}`);
  const parsedData = await parseCafePost(cafeName, postID, imageIndex);
  res.status(200);
  res.send(parsedData);
});

app.listen(port, async () => {
  log.info(`Server started! Listening at ${port}`);
  if (!browser || browser.process().killed) {
    browser = await puppeteer.launch({ headless: true });
  }
  log.info('Browser opened!');
});
