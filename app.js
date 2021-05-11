'use strict'
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();


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


function getGifObjects() {
    axios.get(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=onix&limit=10&offset=0&lang=en`)
        .then(res => {
            const gifObjects = res.data.data;
            return gifObjects;
        })
        .then(gifObjects => {
            gifObjects.sort((o1, o2) => {
                if (o1.rating > o2.rating) {
                    return 1;
                }
                if (o1.rating < o2.rating) {
                    return -1;
                }
                return 0;
            });
            return gifObjects;
        })
        .then(gifObjects => {
            for (const gifObject of gifObjects) {
                axios({
                    url: gifObject.images.fixed_height.url,
                    method: 'GET',
                    responseType: 'stream'
                }).then(response => {
                    response.data.pipe(fs.createWriteStream(assetsPath + fileSeparator + gifObject.username + '_' + gifObject.id + '.' + gifObject.type))
                        .on('finish', () => {console.log(gifObject.username + '_' + gifObject.id + '.' + gifObject.type +' has downloaded.')})
                        .on('error', () => {console.log(gifObject.id + '.' + gifObject.type +' error while downloaded.')});
                });
            }

        })
        .catch(error => {
            console.log(error)
        })
}

getGifObjects();
