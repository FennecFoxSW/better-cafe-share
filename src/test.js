const sharp = require('sharp');
const axios = require('axios');

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

(async () => {
  console.log(await getDefaultCafeTitleImage());
})();
