const http = require('http');

function tuLingQuery (text, formattedAddress, userid = 'test') {
    return new Promise((resolve, reject) => {
        
        const postData = JSON.stringify({
            key: process.env.TULING_KEY,
            info: text,
            loc: formattedAddress,
            userid: userid
        });

        const req = http.request({
            hostname: 'www.tuling123.com',
            port: 80,
            path: '/openapi/api',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            // console.log(`STATUS: ${res.statusCode}`);
            // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                // console.log(`BODY: ${chunk}`);
                data += chunk;
            });
            res.on('end', () => {
                // console.log('No more data in response.');
                try {
                    const result = JSON.parse(data);
                    // console.log(result);
                    resolve(result);
                }
                catch (err) {
                    reject(data);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        req.write(postData);
        req.end();
    });
}

module.exports = tuLingQuery;