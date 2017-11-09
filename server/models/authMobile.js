const http = require('http');
const md5 = require('md5');
const moment = require('moment');
const querystring = require('querystring');

const sendSmsMobileCode = (mobile, code) => {

    const username = process.env.SMS_USERNAME;
    const pw = process.env.SMS_PASSWORD;

    if (!username || ! pw) {
        throw 'SMS username or password undefined.';
    }

    const tkey = moment().format('YYYYMMDDHHmmss');
    const password = (md5(md5(pw) + tkey)).toLowerCase();
    const productid = '676767';
    const content = `您的验证码为${code}`;

    const postData = querystring.stringify({username, tkey, password, productid, mobile, content});

    const req = http.request({
        hostname: 'www.ztsms.cn',
        port: 80,
        path: '/sendNSms.do',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {
        // console.log(`STATUS: ${res.statusCode}`);
        // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            // console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            // console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(postData);
    req.end();
};

module.exports = sendSmsMobileCode;
