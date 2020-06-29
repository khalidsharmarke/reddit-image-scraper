const fs = require('fs');
const fetch = require('node-fetch');
const JSZip = require('jszip');

class Scrapper {
    constructor(url, num_of_images, name) {
        this.zip = new JSZip()
        this.target = url
        this.limit = num_of_images
        this.folder = this.zip.folder(name)
        this.count = 0
        this.nextPage = ''
    }
    async run() {
        while (this.count < this.limit) {
            await this.getPage()
                .then(json => this.parsePage(json))
                .catch(err => console.log(err))
        }
        return this.zip.generateNodeStream({
            type: 'nodeBuffer',
            streamFiles: true
        })
    }
    getPage() {
        return fetch(`${this.target}.json?after=${this.nextPage}`)
            .then(res => res.json())
            .catch(err => err)
    }
    async parsePage(body) {
        this.nextPage = body.data.after
        for (let child of body.data.children) {
            if (!child['data']['preview']) continue
            if (child['data']['preview']['images'][0]['source']['width'] <= 1.3 * (child['data']['preview']['images'][0]['source']['height'])) continue

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

async function fulfillRequest(req_obj) {
    const { url, num_of_images, subreddit } = req_obj;
    return new Scrapper(url, num_of_images, subreddit).run()
}

module.exports = fulfillRequest
