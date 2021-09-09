const fs = require('fs');
const fetch = require('node-fetch');
const JSZip = require('jszip');

class Scraper {
    constructor(url, num_of_images, name, mobile) {
        this.zip = new JSZip()
        this.target = url
        this.limit = num_of_images
        this.folder = this.zip.folder(name)
        this.count = 0
        this.nextPage = ''
        if (mobile) {
            this.ratio = 0.5625
        } else {
            this.ratio = 1.7
        }
    }
    async run() {
        while (this.count < this.limit) {
            try {
                await this.getPage()
                    .then(json => this.parsePage(json))
            } catch (err) {
                throw err
            }
        }
        return this.zip.generateNodeStream({
            type: 'nodeBuffer',
            streamFiles: true
        })
    }
    getPage() {
        return fetch(`${this.target}.json?after=${this.nextPage}`)
            .then(res => {
                console.log(res)
                if (res.status != 200) {
                    throw new Error('subreddit doesnt exist')
                } else {
                    return res.json()
                }
            })
            .catch(err => { throw err })
    }
    async parsePage(body) {
        if (body.data.children.length == 0) {
            throw new Error('the subreddit has no data')
        }
        this.nextPage = body.data.after
        for (let child of body.data.children) {
            if (!child['data']['preview']) continue
            if (child['data']['preview']['images'][0]['source']['width'] / child['data']['preview']['images'][0]['source']['height'] <= this.ratio) continue

            const imageTitle = child['data']['preview']['images'][0]['id']
            let imageUrl = child['data']['preview']['images'][0]['source']['url'];
            imageUrl = `https://i${imageUrl.slice(imageUrl.indexOf('.'), imageUrl.indexOf('?'))}`
            try {
                await this.downloadListing({
                    name: imageTitle,
                    url: imageUrl
                })
                this.count++
            } catch (err) {
                continue
            }
            if (this.count == this.limit) break
        }
    }
    downloadListing(listing) {
        return fetch(listing.url)
            .then(res => {
                if (res.status == 200) {
                    return this.folder.file(`${listing.name}.jpg`, res.body)
                } else {
                    throw new Error('image not found')
                }
            })
    }
}

async function getZipFile(req_obj) {
    const { url, num_of_images, subreddit, mobile } = req_obj;
    console.log(mobile)
    return new Scrapper(url, num_of_images, subreddit, mobile).run()
}

module.exports = getZipFile