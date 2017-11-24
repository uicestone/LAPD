const http = require('http');
const { URL } = require('url');

module.exports = (router) => {

    router.route('/proxy')

    .get(async (req, res) => {
        const r = await forward(req.query.url, req.headers);
        let body = r.body;
        const url = new URL(r.url);
        const prefix = url.protocol + '//' + url.host + '/';
        body = body.replace(/src="(?!http)(?!\/\/)/g, `src="${prefix}`);
        body = body.replace(/href="(?!http)(?!\/\/)/g, `href="${prefix}`);
        body = body.replace(/(url"?\()(?!http)(?!\/\/)/g, `$1${prefix}`);
        res.send(body);
        res.end();
    });

    return router;
}

function forward(urlString, headers) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const options = {
            method: 'GET',
            protocol: url.protocol,
            host: url.host,
            path: url.pathname + url.search,
            headers: headers
        };

        options.headers.host = url.host;
        delete options.headers.cookie;
        delete options.headers.referer;
        
        http.request(url, (res) => {
            // console.log(`Got response: ${url}`);
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            if (statusCode >= 400) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (statusCode >= 300) {
                resolve(forward(res.headers.location, headers));
            }

            if (error) {
                console.error(error.message);
                // consume response data to free up memory
                res.resume();
                reject(error);
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                resolve({url: url, headers: res.headers, body: rawData});
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        }).end();
    });
}
