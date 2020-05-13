const util = require('util');
const fs = require('fs')
const fetch = require('node-fetch');
const zipFolder = util.promisify(require('zip-folder'));
const streamPipeline = util.promisify(require('stream').pipeline)

async function scrape(url, num_of_images) {
    let status = {
        target: url,
        limit: num_of_images,
        listings: [],
        nextPage: '',
        folder: `${__dirname}${url.slice(url.lastIndexOf('/'), url.length)}`
    }

    (function(){
        if (url[url.length - 1] == '/'){
            status.target.pop();
        }
    })()

    function parseUrls(body, folder_name) {
        let requestObj = body.data;

        this.nextPage = requestObj.after

        for (let child of requestObj.children) {
            if (this.listings.length == this.limit) {
                break
            }
            // check if post has image
            if (!child['data']['preview']) {
                continue
            } // check if post is worth scraping for desktop
            if (child['data']['preview']['images'][0]['source']['width'] <= 1.3 * (child['data']['preview']['images'][0]['source']['height'])) {
                continue
            }
            let imageObj = {}
            let imageTitle = child['data']['title'];
            let imageUrl = child['data']['preview']['images'][0]['source']['url'];

            imageObj.url = `https://i${imageUrl.slice(imageUrl.indexOf('.'), imageUrl.indexOf('?'))}`
            imageObj.title = ''

            for (let i = 0; i < imageTitle.length; i++) {
                if (imageTitle[i] == '<' || imageTitle[i] == '>' || imageTitle[i] == ':' || imageTitle[i] == '"' || imageTitle[i] == '/' || imageTitle[i] == '|' || imageTitle[i] == '?' || imageTitle[i] == '*' | imageTitle[i] == '[' | imageTitle[i] == ']') {
                    continue
                } else {
                    imageObj.title += imageTitle[i]
                }
            }
            imageObj.title += imageUrl.slice(imageUrl.lastIndexOf('.'), imageUrl.indexOf('?'))

            this.listings.push(imageObj)

            downloadListing(imageObj, this.folder)
        }
    }

    function downloadListing(imageObj, folder_name) {
        fetch(imageObj['url'])
            .then(res => {
                if (!res.ok) {
                    rej(new Error(`unexpected response ${res.statusText}`));
                }

                streamPipeline(res.body, fs.createWriteStream(`${folder_name}/${imageObj.title}`));
            });
    }

    // this is an implicit loop - not tested might not access to status yet
    // async function getListingsButMoreInteresting(key){
    //     await fetch(`${status.target}.json?after=${key}`)
    //         .then(res => res.json)
    //         .then(parseUrls.bind(status))
    //     if(status.listings.length < status.limit){
    //         getListingsButMoreInteresting(status.nextPage)
    //     }    
    // }

    async function getListings() {
        while (status.listings.length < status.limit) {
            await fetch(`${status.target}.json?after=${status.nextPage}`)
                .then(res => res.json())
                .then(parseUrls.bind(status))
                .catch(err => { throw err })
        }
        return status.folder
    }

    await new Promise((ful, rej) => {
        fs.mkdir(status.folder, { recursive: true }, async (err, path) => {
            await getListings()
                .then(zipFolder(path))
                .catch(err =>  rej(err))
            ful()
        })
    })

    return status.folder
}

module.exports = scrape