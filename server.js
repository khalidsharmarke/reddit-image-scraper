const express = require('express');
const app = express();
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline);

const fulfillRequest = require('./scrapper.js')
const { sanitize, validate } = require('./sanitize-validate.js')
app.use(express.json())
app.use('/public', express.static(`${__dirname}/public`))

app.use('/:endpoint', (req, res) => {
    if (req.get('USer-Agent').includes('Mozilla')) {
        res.redirect('/')
    } else {
        res.status(400).send('pleass send requests to /')
    }
})

app.get('/', (req, res) => {
    if (req.get('User-Agent').includes('Mozilla')) {
        res.sendFile(`${__dirname}/public/form.html`)
    } else {
        res.send('visit www.somewhere.com for documentation on this API')
    }
})

app.post('/', validate, sanitize, async (req, res) => {
	try {
		let zipstream = await fulfillRequest(req.locals)
		res.writeHead(200, {
			'Content-type': 'application/zip',
			'Content-Disposition': `attachment; filename=${req.locals.subreddit}`
		})
		await streamPipeline(zipstream, res)
		res.end()
	} catch(err){
		console.error(err)
		res.send(err)
	}
})

app.listen(process.env.PORT || 8000, () => console.log('running'))
