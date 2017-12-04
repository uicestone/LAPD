const bluebird = require('bluebird');
const crypto = require('crypto');
const moment = require('moment');
const sendSmsMobileCode = require('../models/authMobile.js');
const redisClient = require('redis').createClient();
const User = require('../models/user');
const parseUrl = require('url').parse;
const parseQueryString = require('querystring').parse;

bluebird.promisifyAll(redisClient);

module.exports = (router) => {
    
    router.route('/auth/login')
        .post(async (req, res) => {
            
            if(!req.body.username) {
                res.status(400).json({message: '请输入用户名'});
                return;
            }

            if(!req.body.password) {
                res.status(400).json({message: '请输入密码'});
                return;
            }

            const user = await User.findOne({$or:[{email: req.body.username}, {username: req.body.username}]}).select(['+password', '+token']);
                
            if(!user) {
                res.status(401).json({message: '用户不存在'});
                return;
            }

            if(user.password !== req.body.password) {
                res.status(403).json({message: '密码错误'});
                return;
            }

            if(user.token) {
                user.password = undefined;
                res.json(user);
            }
            else {
                const token = crypto.randomBytes(48).toString('hex');
                user.token = token;
                await user.save();
                user.password = undefined;
                res.json(user);
            }
        });

    router.route('/auth/logout')
        .get((req, res) => {
            res.end();
        });

    router.route('/auth/user')
        .get(async (req, res) => {

            if (!req.user) {
                res.json({status: 401, message: '用户未登陆'});
                throw {status: 401, message: '用户未登陆'};
            }

            if (req.headers.referer && !req.user.openid) {
                
                const code = parseQueryString(parseUrl(req.headers.referer).query).code;

                if (code) {
                    const OAuth = require('wechat-oauth');
                    const wechat = require('wechat');
                    bluebird.promisifyAll(OAuth.prototype);
                    const wechatClient = new OAuth(process.env.WECHAT_APP_ID, process.env.WECHAT_APP_SECRET);
                    const result = await wechatClient.getAccessTokenAsync(code);
                    const accessToken = result.data.access_token;
                    const openid = result.data.openid;
                    req.user.openid = openid;
                    req.user.save();
                }
            }

            res.json(req.user);
        });

    router.route('/auth/mobile')
        .post(async (req, res) => {
            const mobile = req.body.mobile;
            let code = await redisClient.getAsync(`mobile_auth_code_${mobile}`);

            if (!code) {
                code = ((Math.random()* 9 + 1) * 1000).toFixed();
                redisClient.setex(`mobile_auth_code_${mobile}`, 600, code);
            }

            sendSmsMobileCode(mobile, code);

            res.end();
        });

    router.route('/auth/login-mobile')
        .post(async (req, res) => {
            const mobile = req.body.mobile;
            const code = await redisClient.getAsync(`mobile_auth_code_${mobile}`);

            if (Number(code) !== req.body.code) {
                res.status(403).json({message: '手机短信验证码错误'});
                return;
            }

            let user = await User.findOne({mobile}).select(['+token']);

            if (!user) {
                user = new User({mobile, roles: ['potential']});
                user.save();
            }

            if(user.token) {
                res.json(user);
            }
            else {
                crypto.randomBytes(48, (err, buffer) => {
                    const token = buffer.toString('hex');
                    user.token = token;
                    user.save();
                    user.password = undefined;
                    res.json(user);
                });
            }
        });

    return router;
}
