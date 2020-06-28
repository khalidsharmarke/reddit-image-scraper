const express = require('express');
const app = express();
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline);

const fulfillRequest = require('./scrapper.js')
const { sanitize, validate } = require('./sanitize-validate.js')
app.use(express.json())

app.use('/:endpoint', (req, res) => {
    if (req.get('USer-Agent').includes('Mozilla')) {
        res.redirect('/')
    } else {
        res.status(400).send('pleass send requests to /')
    }
})

app.get('/', (req, res) => {
    if (req.get('User-Agent').includes('Mozilla')) {
        res.sendFile(`${__dirname}/form.html`)
    } else {
        res.send('visit www.somewhere.com for documentation on this API')
    }
})

app.post('/', validate, sanitize,  (req, res) => {
    fulfillRequest(req.locals)
    	.then(stream => {
    		res.setHeader('Content-type', 'application/zip')
    		streamPipeline(stream, res.write())
    			.then(()=> res.end())
    	})
    	.catch(() => res.status(500).send('issue with sending data'))
})

app.listen(process.env.PORT || 8000, () => console.log('running'))
