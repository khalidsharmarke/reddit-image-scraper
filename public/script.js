    function getForm() {
        const url = document.getElementById('url').value;
        const num_of_images = document.getElementById('num_of_images').value

        if (url == '' || num_of_images == '') {
            throw new Error('please fill form before submitting')
        } else if (!url.includes('http://www.reddit.com/r/') && !url.includes('https://www.reddit.com/r/')) {
            throw new Error('please provide full url')
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
        return fetch('/', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(form)
            })
            .then(res => {
                if (res.status != 200) {
                    res.text()
                        .then(text => alert(text))
                        .catch(err => alert(err.message))
                } else {
                    res.arrayBuffer()
                        .then(async buffer =>
                            download(buffer, res.headers.get('Content-Disposition').split('filename=')[1].split(';')[0], 'application/zip'))
                        .catch(err => alert(err.message))
                }
            })
            .catch(err => alert(err.message))
    }

    document.querySelector('form').addEventListener('submit', async e => {
        e.preventDefault();
        const loader = loading()
        loader.next()
        try {
            await request()
        } catch (err) {
            alert(err.message)
        }
        loader.next()
    })
