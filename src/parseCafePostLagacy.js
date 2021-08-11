const readingTime = require('reading-time');
const pino = require('pino');

module.exports = async (browser, urlCafeName, postID, imageIndex) => {
  const log = pino({
    name: `parseCafePost(${urlCafeName}/${postID}, ${imageIndex})`,
    prettyPrint: true,
  });
  const postURL = `https://cafe.naver.com/${urlCafeName}/${postID}`;
  log.info(`Generated cafe post URL: ${postURL}`);
  log.info(`Opening page...`);
  const page = await browser.newPage();
  await page.goto(postURL);
  log.info(`Finding #cafe_main iframe...`);
  const mainHandle = await page.$('#cafe_main');
  const main = await mainHandle.contentFrame();
  log.info(`Iframe found!`);

  const getTextContent = (element) => element.textContent;
  const getPostHasImage = (element) =>
    element.querySelector('.se-image-resource') !== null;
  const getImageURL = (element) => element.src;

  let hasImage = true;

  log.info(`Wait for cafe name load...`);
  await page.waitForSelector('.cafe_name');
  log.info(`Cafe name loaded!`);
  const cafeNameElement = await page.$('.cafe_name');
  const cafeName = await page.evaluate(getTextContent, cafeNameElement);
  log.info(`Cafe name: ${cafeName}`);

  log.info(`Wait for board link load...`);
  await main.waitForSelector('.link_board');
  log.info(`Board link loaded!`);
  const boardNameElement = await main.$('.link_board');
  const boardName = (
    await main.evaluate(getTextContent, boardNameElement)
  ).trim();
  log.info(`Board name: ${boardName}`);

  log.info(`Wait for post title text load...`);
  await main.waitForSelector('.title_text');
  log.info(`Post title text loaded!`);
  const postTitleElement = await main.$('.title_text');
  const postTitle = (
    await main.evaluate(getTextContent, postTitleElement)
  ).trim();
  log.info(`Post title: ${postTitle}`);

  log.info(`Wait for post content load...`);
  await main.waitForSelector('.content .se-main-container');
  log.info(`Post content loaded!`);
  const contentElement = await main.$('.content .se-main-container');
  const content = (
    await main.evaluate(getTextContent, contentElement)
  ).replaceAll(/\s+/g, ' ');
  const postReadingTime = Math.floor(readingTime(content).minutes);
  log.info(`Reading time: ${postReadingTime} minutes`);

  hasImage = await main.evaluate(getPostHasImage, contentElement);
  let thumbnailImageURL;

  if (hasImage) {
    log.info(`Wait for post image load...`);
    await main.waitForSelector('.se-image-resource');
    log.info(`Post image loaded!`);
    const thumbnailImageElements = await main.$$('.se-image-resource');
    const thumbnailImageElement = thumbnailImageElements[imageIndex];
    thumbnailImageURL = await main.evaluate(getImageURL, thumbnailImageElement);
    log.info(`Post image URL: ${thumbnailImageURL}`);
  } else {
    log.info(`Opps, post has no image, wait for cafe title image...`);
    await page.waitForSelector('#front-img .png24');
    log.info(`Cafe title image loaded!`);
    const cafeTitleImageElement = await page.$('#front-img .png24');
    const cafeTitleImage = await page.evaluate(
      getImageURL,
      cafeTitleImageElement
    );
    thumbnailImageURL = cafeTitleImage;
    log.info(`Cafe title image URL: ${thumbnailImageURL}`);
  }

  log.info(`Wait for creation date from article info...`);
  await main.waitForSelector('.article_info .date');
  log.info(`Creation date loaded!`);
  const creationDateElement = await main.$('.article_info .date');
  const creationDate = await main.evaluate(getTextContent, creationDateElement);
  log.info(`Creation date: ${creationDate}`);

  log.info(`Wait for author profile image...`);
  await main.waitForSelector('.WriterInfo .thumb img');
  log.info(`Author profile image loaded!`);
  const authorProfileImageElement = await main.$('.WriterInfo .thumb img');
  const authorProfileImageURL = await main.evaluate(
    getImageURL,
    authorProfileImageElement
  );
  log.info(`Author profile image URL: ${authorProfileImageURL}`);

  log.info(`Wait for author name...`);
  await main.waitForSelector('.WriterInfo .nickname');
  log.info(`Author name loaded!`);
  const authorNameElement = await main.$('.WriterInfo .nickname');
  const authorName = (
    await main.evaluate(getTextContent, authorNameElement)
  ).trim();
  log.info(`Author name: ${authorName}`);

  log.info(`Wait for author level...`);
  await main.waitForSelector('.WriterInfo .nick_level');
  log.info(`Author level loaded!`);
  const authorLevelElement = await main.$('.WriterInfo .nick_level');
  const authorLevel = (
    await main.evaluate(getTextContent, authorLevelElement)
  ).trim();
  log.info(`Author level: ${authorLevel}`);

  log.info(`Wait for like count...`);
  await main.waitForSelector('.ReplyBox .like_article .u_cnt');
  log.info(`Like count loaded!`);
  const likeCountElement = await main.$('.ReplyBox .like_article .u_cnt');
  const likeCount = await main.evaluate(getTextContent, likeCountElement);
  log.info(`Like count: ${likeCount}`);

  log.info(`Wait for comment count...`);
  await main.waitForSelector('.ReplyBox .button_comment .num');
  log.info(`Comment count loaded!`);
  const commentCountElement = await main.$('.ReplyBox .button_comment .num');
  const commentCount = await main.evaluate(getTextContent, commentCountElement);
  log.info(`Comment count: ${commentCount}`);

  return {
    cafeName,
    boardName,
    postTitle,
    thumbnailImageURL,
    creationDate,
    authorName,
    authorLevel,
    authorProfileImageURL,
    likeCount,
    commentCount,
    postReadingTime,
  };
};
