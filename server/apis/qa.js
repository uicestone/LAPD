const Qa = require('../models/qa.js');
const User = require('../models/user.js');
const tuLingQuery = require('../models/tuling.js');
const { amapRGeo, amapConvert } = require('../models/amap.js');
const striptags = require('striptags');
const decode = require('decode-html');
const elasticsearch = require('elasticsearch');
const es = new elasticsearch.Client({
    host: process.env.ELASTIC_URL
    // log: 'trace'
});

module.exports = (router) => {

    router.route('/qa/query')
        .post(async (req, res) => {
            if (req.body.text.trim() === '0') {
                res.json({text:'您的专属律师助理即将为您服务…'});
                return
            }

            let formattedAddress;

            if (req.body.location) {
                const amapLocation = await amapConvert(req.body.location);
                const amapResult = await amapRGeo(amapLocation);
                formattedAddress = amapResult.regeocode.formatted_address;
                console.log(formattedAddress);
            }
            
            const reply = await tuLingQuery(req.body.text, formattedAddress/*, userid*/);

            esRes = await es.search({
                index: 'qa_v1',
                type: 'qa',
                q: req.body.text,
                size: 20
            });

            // console.log(req.body.text, esRes.hits.hits.map(hit => [hit._score, hit._source.q]));

            if (esRes.hits.max_score > 18) {
                reply.qas = esRes.hits.hits.map(hit => Object.assign({_id: hit._id}, hit._source));
            }

            res.json(reply);
        });

    // Qa CURD
    router.route('/qa')

        // create a qa
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

        // get all the qas
        .get(async (req, res) =>{

            const limit = +req.query.limit || 20;
            let skip = +req.query.skip || 0;

            let query = Qa.find();

            if(req.query.page && !skip) {
                skip = (req.query.page - 1) * limit;
            }

            if (req.query.q) {
                esRes = await es.search({
                    index: 'qa_v1',
                    type: 'qa',
                    q: req.query.q,
                    size: limit,
                    from: skip
                });

                // console.log(req.body.text, esRes.hits.hits.map(hit => [hit._score, hit._source.q]));
                const qaIds = esRes.hits.hits.map(hit => hit._id);
                
                query.find({_id: {$in: qaIds}});
            }

            let total, page;

            if (req.query.q) {
                total = esRes.hits.total;
                page = await query.find().exec();
            }
            else {
                total = await query.count();
                page = await query.find().limit(limit).skip(skip).exec();
            }

            if(skip + page.length > total) {
                total = skip + page.length;
            }

            res.set('items-total', total)
                .set('items-start', Math.min(skip + 1, total))
                .set('items-end', Math.min(skip + limit, total))
                .json(page);

        });

    // on routes that end in /qa/:qaId
    // ----------------------------------------------------
    router.route('/qa/:qaId')

        // get the qa with that id
        .get((req, res) => {
            Qa.findById(req.params.qaId).then(qa => {
                qa.a = striptags(decode(qa.a), ['a'], '\n').replace(/\n{2,}/g, '\n');
                res.json(qa);
                // TODO update user valueAdd count when order is finished
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        .put((req, res) => {
            Qa.findByIdAndUpdate(req.params.qaId, req.body, {new: true}).then(qa => {
                es.index({
                    index: 'qa_v1',
                    type: 'qa',
                    id: qa._id.toString(),
                    body: {
                        q: qa.q,
                        date: qa.date,
                        source: qa.source,
                        cat: qa.cat,
                        tags: qa.tags,
                        rating: qa.rating
                    }
                }, (err, res) => {
                    if (err) {
                        console.error(err);
                    }
                });
                res.json(qa);
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        })

        // delete the qa with this id
        .delete((req, res) =>{
            Qa.findByIdAndRemove(req.params.qaId).then(() => {
                res.end();
            }).catch(err => {
                console.error(err);
                res.status(500);
            });
        });

    return router;
}
