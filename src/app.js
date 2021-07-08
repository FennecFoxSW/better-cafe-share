// const ejs = require('ejs');
const express = require('express');
const log = require('pino')({ prettyPrint: true });
const httpLog = require('pino-http')({
  logger: log,
});

const app = express();
const port = process.env.PORT ?? 3000;

const parseCafePost = require('./parseCafePost');

app.use((req, res, next) => {
  httpLog(req, res);
  next();
});

app.get('/s/:cafeName/:postID', async (req, res) => {
  const { cafeName, postID } = req.params;
  const imageIndex = req.query.img_index ?? 0;
  const parseData = await parseCafePost(cafeName, postID, imageIndex);

  res.status(200).send(parseData);
});

app.listen(port, () => {
  log.info('Server started!');
});
