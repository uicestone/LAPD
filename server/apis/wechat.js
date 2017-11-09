const bluebird = require('bluebird');
const Buffer = require('buffer').Buffer;
const OAuth = require('wechat-oauth');
const wechat = require('wechat');

bluebird.promisifyAll(OAuth.prototype);

const wechatClient = new OAuth(process.env.WECHAT_APP_ID, process.env.WECHAT_APP_SECRET);
const wechatConfig = {
    token: process.env.WECHAT_TOKEN,
    appid: process.env.WECHAT_APP_ID,
    encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY,
    checkSignature: true
};

module.exports = (router) => {
    
    router.route('/wechat').all(wechat(wechatConfig, function (req, res, next) {
        const message = req.weixin;
        console.log('Message received', message);
    }));
    
	router.route('/wechat/oauth/:code').get(async (req, res) => {
		const code = req.params.code;
		const result = await wechatClient.getAccessTokenAsync(code);
		const accessToken = result.data.access_token;
		const openid = result.data.openid;
		console.log(openid);
	});

    return router;
};
