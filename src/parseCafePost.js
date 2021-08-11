const cheerio = require('cheerio');
const axios = require('axios');
const sharp = require('sharp');
const readingTime = require('reading-time');
const dayjs = require('dayjs');
const localizedFormat = require('dayjs/plugin/localizedFormat');
require('dayjs/locale/ko');

dayjs.extend(localizedFormat);
dayjs.locale('ko');

let croppedDefaultTitleImage = '';

async function getDefaultCafeTitleImage() {
  if (croppedDefaultTitleImage === '') {
    const cafeTitleImage =
      'https://ssl.pstatic.net/static/cafe/cafe_pc/bg_default_title_black.png';
    const cafeTitleImageResponse = await axios.get(cafeTitleImage, {
      responseType: 'arraybuffer',
    });
    const cafeTitleImageBuffer = Buffer.from(cafeTitleImageResponse.data);
    croppedDefaultTitleImage = sharp(cafeTitleImageBuffer)
      .resize({ width: 1160, height: 480, position: 'right top' })
      .toBuffer()
      .then((data) => {
        const imageBase64Data = data.toString('base64');
        return `data:image/png;base64,${imageBase64Data}`;
      });
  }
  return croppedDefaultTitleImage;
}

async function getArticleImageURL(contentHTML, index, urlCafeName) {
  const parsedContent = cheerio.load(contentHTML);
  const imgs = parsedContent('img.se-image-resource');
  let imageURL = imgs.eq(index).attr('src');
  if (imgs.length === 0) {
    const cafeURL = `https://cafe.naver.com/${urlCafeName}`;
    const cafeHTML = (await axios.get(cafeURL)).data;
    const parsedCafe = cheerio.load(cafeHTML);
    const cafeTitleImage = parsedCafe('.png24');
    if (cafeTitleImage.length === 0) {
      imageURL = await getDefaultCafeTitleImage();
    } else imageURL = cafeTitleImage.eq(0).attr('src');
  } else if (imgs.length < index) imageURL = imgs.eq(0).attr('src');
  return imageURL;
}

function getReadingTime(contentHTML) {
  const parsedContent = cheerio.load(contentHTML);
  const contentText = parsedContent.text();
  const contentReadingTime = Math.floor(
    readingTime(contentText.replaceAll(/\s\s+/g, ' '), { wordsPerMinute: 220 })
      .minutes
  );
  return contentReadingTime;
}

module.exports = async (urlCafeName, postID, imageIndex) => {
  const getArticleURL = `https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/${urlCafeName}/articles/${postID}?useCafeId=false`;
  const getArticleResponse = await axios.get(getArticleURL);
  const articleResponseData = getArticleResponse.data.result;

  const cafeData = articleResponseData.cafe;
  const cafeName = cafeData.pcCafeName;
  const cafeID = cafeData.id;

  const getLikeCountURL = `https://cafe.like.naver.com/v1/search/contents?q=CAFE[${cafeID}_${urlCafeName}_${postID}]`;
  const getLikeCountResponse = await axios.get(getLikeCountURL);

  const articleData = articleResponseData.article;
  const articleSubject = articleData.subject;
  const articleRawWriteDate = articleData.writeDate;
  const articleDisplayWriteDate = dayjs(articleRawWriteDate).format('l LT');
  const articleReadCount = articleData.readCount;
  const articleCommentCount = articleData.commentCount;
  const articleContentHTML = articleData.contentHtml;
  const articleReadingTime = getReadingTime(articleContentHTML);
  const articleLikeCountData = getLikeCountResponse.data.contents[0];
  const articleLikeCount = articleLikeCountData.reactions[0]?.count ?? 0;
  const articleThumbnailImgURL = await getArticleImageURL(
    articleContentHTML,
    imageIndex,
    urlCafeName
  );

  const boardData = articleData.menu;
  const boardName = decodeURI(boardData.name);

  const authorData = articleData.writer;
  const authorName = authorData.nick;
  const authorLevel = authorData.memberLevelName;
  const authorImageURL = `${authorData.image.url}?type=${authorData.image.type}`;

  const parsedData = {
    cafeName,
    boardName,
    articleSubject,
    articleDisplayWriteDate,
    articleReadCount,
    articleCommentCount,
    articleLikeCount,
    articleReadingTime,
    articleThumbnailImgURL,
    authorName,
    authorLevel,
    authorImageURL,
  };
  return parsedData;
};
