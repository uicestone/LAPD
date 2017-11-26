const bluebird = require('bluebird');
const { Buffer } = require('buffer');
const OAuth = require('wechat-oauth');
const wechat = require('wechat');
const WechatAPI = require('wechat-api');
const User = require('../models/user.js');
const Qa = require('../models/qa.js');
const tuLingQuery = require('../models/tuling.js');
const { amapRGeo } = require('../models/amap.js');
const elasticsearch = require('elasticsearch');
const redis = require("redis");
const striptags = require('striptags');
const decode = require('decode-html');

bluebird.promisifyAll(OAuth.prototype);
bluebird.promisifyAll(WechatAPI.prototype);
bluebird.promisifyAll(redis.RedisClient.prototype);

const wechatClient = new OAuth(process.env.WECHAT_APP_ID, process.env.WECHAT_APP_SECRET);
const wechatApi = new WechatAPI(process.env.WECHAT_APP_ID, process.env.WECHAT_APP_SECRET);
const wechatConfig = {
    token: process.env.WECHAT_TOKEN,
    appid: process.env.WECHAT_APP_ID,
    encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY,
    checkSignature: true
};
const es = new elasticsearch.Client({
    host: process.env.ELASTIC_URL
    // log: 'trace'
});
const redisClient = redis.createClient();

module.exports = (router) => {
    
    router.route('/wechat').all(wechat(wechatConfig, async (req, res, next) => {
        const message = req.weixin;
        console.log('Message received', message);

        // 根据openid创建或获得用户
        let user = await User.findOne({openid: message.FromUserName});

        if (!user) {
            user = new User({ openid: message.FromUserName });
            user.save();
        }

        if (message.Event === 'LOCATION') {
            user.location = {
                latitude: message.Latitude,
                longitude: message.Longitude,
                precision: message.Precision,
                time: new Date(message.CreateTime)
            };

            user.save();

            const amapResult = await amapRGeo(`${user.location.longitude},${user.location.latitude}`);
            user.location.formattedAddress = amapResult.regeocode.formatted_address;

            user.save();
        }

        if (message.Content === '0') {
            return res.reply('您的专属律师助理即将为您服务…');
        }
        else if (message.Content > 0 && message.Content <= 10) {
            const qaId = await redisClient.getAsync(`session_qa_${user.openid}_${message.Content}`);
            const qa = await Qa.findById(qaId);

            if (!qa) {
                return res.reply();
            }

            // console.log('full answer: ', striptags(decode(qa.a), ['a'], '\n'));

            striptags(decode(qa.a), ['a'], '\n').replace(/\n{2,}/g, '\n').splitMaxBytes(2048).reduce((p, chunk) => {
                return p.then(() => {
                    // console.log('Byte Length', Buffer.byteLength(chunk));
                    // console.log('send to user: ', chunk);
                    wechatApi.sendText(user.openid, chunk, function(err, result) {
                        // console.log(err, result);
                    });
                    return sleep(5000);
                });
            }, Promise.resolve());

            return res.reply();
        }
        else if (message.Content) {
            esRes = await es.search({
                index: 'qa_v1',
                type: 'qa',
                q: message.Content
            });

            const reply = await tuLingQuery(message.Content, user.location.formattedAddress, user.openid);

            // console.log(req.body.text, esRes.hits.hits.map(hit => [hit._score, hit._source.q]));

            if (esRes.hits.max_score > 18) {
                reply.text += "\n\n您是不是想问：\n\n"
                + (esRes.hits.hits.map((hit, index) => {
                    // 暂存hit._id到index+1供查询
                    redisClient.setex(`session_qa_${user.openid}_${index+1}`, 600, hit._id);
                    return `${index+1}. ${hit._source.q}？`;
                }).join("\n"))
                + "\n\n回复“0”转人工服务";
            }

            res.reply(reply.text);
        }

    }));
    
	router.route('/wechat/oauth/:code').get(async (req, res) => {
		const code = req.params.code;
		const result = await wechatClient.getAccessTokenAsync(code);
		const accessToken = result.data.access_token;
		const openid = result.data.openid;
		// console.log(openid);
	});

    return router;
};

function sleep(timeout = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
}

String.prototype.splitMaxBytes = function (byte) {
    const chunks = [];
    let chunk = '';
    const paras = this.split('\n');
    paras.forEach((para, index) => {
        if (Buffer.byteLength(chunk + para) > byte || index === paras.length - 1) {
            chunks.push(chunk.trim());
            chunk = para;
        }
        else {
            chunk += para + '\n';
        }
    });
    return chunks;
}
