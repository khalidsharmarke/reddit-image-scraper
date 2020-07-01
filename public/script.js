    function getForm() {
        const url = document.getElementById('url').value;
        const num_of_images = document.getElementById('num_of_images').value

        if (url == '' || num_of_images == '') {
            alert('please fill form before submitting')
            return
        } else if (!url.includes('http://www.reddit.com/r/') && !url.includes('https://www.reddit.com/r/')) {
            alert('please provide full url')
            return
        }
        return {
            url: url,
            num_of_images: Number(num_of_images),
            mobile: document.getElementById('mobile').checked
        }
    }

    function* loading() {
        const button = document.querySelector('button')
        let loader = document.createElement('span')
        loader.className = 'spinner-border spinner-border-sm'
        button.textContent = 'Retrieving...'
        button.append(loader)
        button.disabled = true
        yield
        button.innerHTML = 'Retrieve'
        button.disabled = false
        return
    }

    function request() {
        const form = getForm()
        if (!form) return
            console.log(form)
        return fetch('/', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(form)
            })
            .then(res => {
                if (res.status == 400) {
                    res.text()
                        .then(text => { throw text })
                } else if (res.status == 200) {
                    res.arrayBuffer()
                        .then(async buffer =>
                            await download(buffer, res.headers.get('content-disposition').split('filename=')[1].split(';')[0], 'application/zip'))
                        .catch(err => {throw err})
                }
            })
            .catch(err => { throw err })
    }

    document.querySelector('form').addEventListener('submit', async e => {
        e.preventDefault();
        const loader = loading()
        loader.next()
        await request()
            .catch(err => alert(err))
        loader.next()
    })
