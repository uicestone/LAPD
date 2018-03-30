const Session = require('../models/session.js');

module.exports = (router) => {

    // Session CURD
    router.route('/session')

        // create a session
        .post((req, res) => {

            let session = new Session(req.body);      // create a new instance of the Session model
            session.startedAt = new Date();
            // save the session and check for errors
            session.save().then(session => {
                res.json(session);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });

        })

        // get all the sessions
        .get(async (req, res) =>{

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = Session.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if(req.query.orderBy) {
                query.sort({
                    [req.query.orderBy]: (req.query.order === 'desc' || req.query.order === 'false' || Number(req.query.order) < 0 ? 'desc' : 'asc')
                });
            }
            else {
                query.sort({startedAt:-1});
            }

            let total = await query.count();
            let page = await query.find()
            .populate('user')
            .populate({path: 'messages.qas', select: 'q'})
            .limit(limit).skip(skip).exec();

            if(skip + page.length > total) {
                total = skip + page.length;
            }

            // page = page.map(item => {
            //     return item.populate('messages.1.qas.0');
            // });

            res.set('items-total', total)
                .set('items-start', Math.min(skip + 1, total))
                .set('items-end', Math.min(skip + limit, total))
                .json(page);

        });

    // on routes that end in /session/:sessionId
    // ----------------------------------------------------
    router.route('/session/:sessionId')

        // get the session with that id
        .get((req, res) => {
            Session.findById(req.params.sessionId).populate('user').populate({path: 'messages.qas', select: 'q'}).then(session => {
                if (!session) {
                    res.status(404).send('Session not found.');
                    throw `Session not found: ${req.params.sessionId}.`;
                }
                res.json(session);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {
            Session.findByIdAndUpdate(req.params.sessionId, req.body, {new: true}).then(session => {
                res.json(session);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the session with this id
        .delete((req, res) =>{
            Session.findByIdAndRemove(req.params.sessionId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    return router;
}
