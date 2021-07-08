const puppeteer = require('puppeteer');

module.exports = async (urlCafeName, postID, imageIndex) => {
  const postURL = `https://cafe.naver.com/${urlCafeName}/${postID}`;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(postURL);
  const mainHandle = await page.$('#cafe_main');
  const main = await mainHandle.contentFrame();

  const getTextContent = (element) => element.textContent;
  const getImageURL = (element) => element.src;

  const cafeNameElement = await page.$('.cafe_name');
  const cafeName = await page.evaluate(getTextContent, cafeNameElement);

  await main.waitForSelector('.link_board');
  const boardNameElement = await main.$('.link_board');
  const boardName = (
    await main.evaluate(getTextContent, boardNameElement)
  ).trim();

  await main.waitForSelector('.title_text');
  const postTitleElement = await main.$('.title_text');
  const postTitle = (
    await main.evaluate(getTextContent, postTitleElement)
  ).trim();

  await main.waitForSelector('.se-image-resource');
  const thumbnailImageElements = await main.$$('.se-image-resource');
  const thumbnailImageElement = thumbnailImageElements[imageIndex];
  const thumbnailImageURL = await main.evaluate(
    getImageURL,
    thumbnailImageElement
  );

  await main.waitForSelector('.article_info .date');
  const creationDateElement = await main.$('.article_info .date');
  const creationDate = await main.evaluate(getTextContent, creationDateElement);

  await main.waitForSelector('.WriterInfo .thumb img');
  const authorProfileImageElement = await main.$('.WriterInfo .thumb img');
  const authorProfileImageURL = await main.evaluate(
    getImageURL,
    authorProfileImageElement
  );

  await main.waitForSelector('.WriterInfo .nickname');
  const authorNameElement = await main.$('.WriterInfo .nickname');
  const authorName = (
    await main.evaluate(getTextContent, authorNameElement)
  ).trim();

  await main.waitForSelector('.WriterInfo .nick_level');
  const authorRoleElement = await main.$('.WriterInfo .nick_level');
  const authorRole = (
    await main.evaluate(getTextContent, authorRoleElement)
  ).trim();

  await main.waitForSelector('.ReplyBox .like_article .u_cnt');
  const likeCountElement = await main.$('.ReplyBox .like_article .u_cnt');
  const likeCount = await main.evaluate(getTextContent, likeCountElement);

  await main.waitForSelector('.ReplyBox .button_comment .num');
  const commentCountElement = await main.$('.ReplyBox .button_comment .num');
  const commentCount = await main.evaluate(getTextContent, commentCountElement);

  return {
    cafeName,
    boardName,
    postTitle,
    thumbnailImageURL,
    creationDate,
    authorName,
    authorRole,
    authorProfileImageURL,
    likeCount,
    commentCount,
  };
};
