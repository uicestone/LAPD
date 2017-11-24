const User = require('../models/user');

module.exports = function(req, res, next) {

    if(['/api/auth/login', '/api/auth/login-mobile', '/api/auth/mobile', '/api/wechat', '/api/qa/query', '/api/proxy'].indexOf(req._parsedUrl.pathname) > -1 ) {
        next();
        return;
    }

    const token = req.get('authorization') || req.query.token;

    if(!token) {
        res.status(401).json({message:'无效登录，请重新登录'});
        return;
    }

    User.findOne({token}).select(['+providerTokens']).then((user) => {
        if(!user) {
            res.status(401).json({message:'无效登录，请重新登录'});
            return;
        }

        req.user = user;
        next();
    });

}