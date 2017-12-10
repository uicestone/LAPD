const http = require('http');

function amapRGeo (location) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://restapi.amap.com/v3/geocode/regeo?parameters&key=${process.env.AMAP_KEY}&location=${location}`, (res) => {
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
    });
}

function amapConvert (location, coordsys = 'gps') {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://restapi.amap.com/v3/assistant/coordinate/convert?parameters&key=${process.env.AMAP_KEY}&locations=${location}&coordsys=${coordsys}`, (res) => {
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
                    resolve(result.locations);
                }
                catch (err) {
                    reject(data);
                }
            });
        });
    });
}

module.exports = { amapRGeo, amapConvert };