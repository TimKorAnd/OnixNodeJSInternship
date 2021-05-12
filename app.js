'use strict'
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Jimp = require('jimp');
const { GifUtil,GifFrame,BitmapImage } = require('gifwrap');


const apiKey = 'j4CoPU1TdrRYuzG8H2WxvIp8DEkcuh4v'; // APP: exVB TODO move to config?
const assetsPath = './assets'
const fileSeparator = '/';

const app = express();
const port = 3000;


app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

router.get("/", (req, res) => {
    res.render("index", {greeting: " What`s up?"});
});

router.get("/about", (req, res) => {
    res.render("about", {title: "Hey", message: "Hello there!"});
});

app.use("/", router);
app.listen(process.env.port || port);

console.log("Running at Port 3000");

async function getGifObjectsArray(queriSring) {
    queriSring = queriSring || `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=onix&limit=10&offset=0&lang=en;`
    const response = await  axios.get(queriSring);
    return response.data.data;
}

function sortByRating(gifObjectsArray, sortField = 'rating') {
    return gifObjectsArray.sort((gifObject1, gifObject2) => gifObject1[sortField].localeCompare(gifObject2[sortField]));
}

async function downloadGif(gifObject) {
    const resStream = await axios({
        url: gifObject.images.fixed_height.url,
        method: 'GET',
        responseType: 'stream'
    });
    const fileName = gifObject.username + '_' + gifObject.id + '.' + gifObject.type;
    const writer = fs.createWriteStream(assetsPath + fileSeparator + fileName);

    await resStream.data.pipe(writer)
        .on('finish', () => {
            console.log(gifObject.username + '_' + gifObject.id + '.' + gifObject.type +' has downloaded.');

        })
        .on('error', () => {console.log(gifObject.id + '.' + gifObject.type +' error while downloaded.')});

}
/* Add watermark to all gifs frames
copied from stackoverflow
* */
function addWaterMark(filename, waterMark = 'ONIX') {
    var frames = [];

    Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(async function(font){
        await GifUtil.read(filename).then(inputGif => {
            inputGif.frames.forEach(function(frame){
                const jimpCopied = GifUtil.copyAsJimp(Jimp, frame);
                jimpCopied.print(font,0,0,waterMark);
                const GifCopied = new GifFrame(new BitmapImage(jimpCopied.bitmap,{
                    disposalMethod: frame.disposalMethod,
                    delayCentisecs: frame.delayCentisecs,
                }));
                frames.push(GifCopied);
            });
        });
        GifUtil.quantizeDekker(frames);
        GifUtil.write(filename,frames);
    });
}

async function watermarkGifFilesInFolder(folder = assetsPath) {
     fs.readdirSync(folder + fileSeparator).forEach(file => {
            if (file.endsWith('.gif')) {
                addWaterMark(folder + fileSeparator + file, 'ONIX');
            }
            console.log(file);

    });
}


(async() => {
    const data = await getGifObjectsArray();
    sortByRating(data);
    for (const item of data) {
        await downloadGif(item);
    }
    return 'done';
})().then(async(value) => {
        console.log(value);
        await watermarkGifFilesInFolder();
    }
)
    .catch(console.log);




