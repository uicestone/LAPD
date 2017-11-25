const http = require('http');

function amapRGeo (location) {
    return new Promise((resolve, reject) => {
        const reqAmap = http.get(`http://restapi.amap.com/v3/geocode/regeo?parameters&key=${process.env.AMAP_KEY}&location=${location}`, (resAmap) => {
            // console.log(`STATUS: ${resAmap.statusCode}`);
            // console.log(`HEADERS: ${JSON.stringify(resAmap.headers)}`);
            let data = '';
            resAmap.setEncoding('utf8');
            resAmap.on('data', (chunk) => {
                // console.log(`BODY: ${chunk}`);
                data += chunk;
            });
            resAmap.on('end', () => {
                // console.log('No more data in response.');
                try {
                    const result = JSON.parse(data);
                    // console.log(result);
                    resolve(result)
                }
                catch (err) {
                    reject(data);
                }
            });
        });
    });
}

module.exports = { amapRGeo };