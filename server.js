const express = require('express');
const app = express();
const util = require('util')
const streamPipeline = util.promisify(require('stream').pipeline);

const getZipFile = require('./scrapper.js')
const { sanitize, validate } = require('./sanitize-validate.js')
app.use(express.json())
app.use('/public', express.static(`${__dirname}/public`))

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/public/form.html`)
})

app.post('/', validate, sanitize, async (req, res) => {
	try {
		let zipstream = await getZipFile(req.locals)
		res.writeHead(200, {
			'Content-type': 'application/zip',
			'Content-Disposition': `attachment; filename=${req.locals.subreddit}.zip`
		})
		await streamPipeline(zipstream, res)
		res.end()
	} catch(err){
		console.error(err)
		res.send(err)
	}
})

app.use('/:endpoint', (req, res) => {
    res.redirect('/')
})

app.listen(process.env.PORT || 8000, () => console.log('running'))
