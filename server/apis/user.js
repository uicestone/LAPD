const mongoose = require('mongoose');
const moment = require('moment');
const User = require('../models/user.js');

module.exports = (router) => {
    // User CURD
    router.route('/user')

        // create a user
        .post((req, res) => {
            
            let user = new User(req.body);      // create a new instance of the User model

            // save the user and check for errors
            user.save().then(user => {
                res.json(user);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
            
        })

        // get all the users
        .get((req, res) => {

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = User.find();

            // 非管理员，即服务商,只能按provider_token查看用户
            if (req.user.roles.indexOf('admin') === -1) {
                res.status(403).json({message: '无权查看用户列表'});
            }

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.keyword) {
                query.find({
                    name: new RegExp(req.query.keyword, 'i')
                });
            }

            if(req.query.roles) {
                const roles = Array.isArray(req.query.roles) ? req.query.roles : [req.query.roles];
                query.find({
                    roles: {$in: roles}
                });
            }
            else {
                query.find({
                    roles: {$exists:true}
                });
            }

            query.count()
            .then((total) => {
                return Promise.all([total,
                    query.find().limit(limit).skip(skip).exec()
                ]);
            })
            .then((result) => {
                let [total, page] = result;

                if(skip + page.length > total) {
                    total = skip + page.length;
                }

                // 非管理员，即服务商，只能看到自己对用户提供的增值服务
                if (req.user.roles.indexOf('admin') === -1) {
                    page.forEach(user => {
                        user.valueAdds = user.valueAdds.filter(valueAdd => valueAdd.provider === req.user.provider);
                    });
                }

                res.set('items-total', total)
                .set('items-start', Math.min(skip + 1, total))
                .set('items-end', Math.min(skip + limit, total))
                .json(page);
            });
        });

    // on routes that end in /user/:userId
    // ----------------------------------------------------
    router.route('/user/:userId')

        // get the user with that id
        .get(async (req, res) => {

            try {

                const user = await User.findById(req.params.userId)

                // 非管理员，即服务商，只能看到自己对用户提供的增值服务
                if (req.user.roles.indexOf('admin') === -1) {
                    user.valueAdds = user.valueAdds.filter(valueAdd => valueAdd.provider === req.user.provider);
                }

                res.json(user);
            }
            catch(err) {
                console.error(err);
                res.status(500);
            };
        })

        .put((req, res) => {

            if (req.body.wechatUser) {
                // copy wechatUser into user
                ['avatar', 'gender', 'openid', 'region', 'remark', 'subscribed', 'subscribedAt'].forEach(key => {
                    req.body[key] = req.body.wechatUser[key];
                });

                // delete wechat user from database
                User.remove({_id: req.body.wechatUser._id}).exec();
                delete req.body.wechatUser;
            }

            User.findByIdAndUpdate(req.params.userId, req.body, {new: true}).then(user => {
                
                res.json(user);

            }).then(user => {

            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the user with this id
        .delete((req, res) => {
            User.findByIdAndRemove(req.params.userId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    router.route('/user/:userId/message')
        .post((req, res) => {
            require('../util/wechat.js')(req.query.type);
        });

    return router;
}
