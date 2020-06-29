const fetch = require('node-fetch');

fetch('http://localhost:8000/', {
    method: 'POST',
    headers: {
    	'Content-type': 'application/json'
    },
    body: JSON.stringify({
        url: "http://www.reddit.com/r/EarthPorn",
        num_of_images: 1
    })
}).then(res => {
	if (res.status == 400){
		res.text()
			.then(text => console.log(text))
	}else {
		console.log(res.body)
	}
})
  .catch(err => console.log(err))
