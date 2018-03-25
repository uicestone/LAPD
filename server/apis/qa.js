const Qa = require('../models/qa.js');
const Session = require('../models/session.js');
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

            let session, queryMessage, replyMessage;

            // find or create session
            if (req.body.session) {
                session = await Session.findById(req.body.session);
            }
            else {
                session = new Session({messages: [], startedAt: new Date()});
            }

            // switch to service
            if (req.body.text.trim() === '0') {
                replyMessage = {text:'您的专属律师助理即将为您服务…', time: new Date()};
                res.json(replyMessage);
                session.messages.push(replyMessage);
                return;
            }

            queryMessage = {time: new Date(), text: req.body.text, fromClient: true};
            
            let formattedAddress;

            if (req.body.location) {
                const amapLocation = await amapConvert(req.body.location);
                const amapResult = await amapRGeo(amapLocation);
                formattedAddress = amapResult.regeocode.formatted_address;
                queryMessage.location = req.body.location;
                queryMessage.formattedAddress = formattedAddress;
                // console.log(formattedAddress);
            }

            // start processing reply
            replyMessage = await tuLingQuery(req.body.text, formattedAddress, session._id);

            esRes = await es.search({
                index: 'qa_v1',
                type: 'qa',
                size: 20,
                body: {
                    query: {
                        function_score: {
                            query: {
                                multi_match: {
                                    query: req.body.text,
                                    fields: ['q', 'tags', 'cat']
                                }
                            },
                            field_value_factor: {
                                field: 'rating',
                                modifier: 'none',
                                factor: 1,
                                missing: 0
                            },
                            boost_mode: 'sum'
                        }
                    }
                }
            });

            console.log(req.body.text, esRes.hits.hits.map(hit => [hit._score, hit._source.q, hit._source.cat, ...hit._source.tags]));
            if (esRes.hits.max_score > 15) {
                queryMessage.hitsQa = true;
                replyMessage.qas = esRes.hits.hits.filter(hit => hit._score > 15).map(hit => Object.assign({_id: hit._id}, hit._source));
            }

            replyMessage.session = session._id;

            session.messages.push(queryMessage);
            session.messages.push(replyMessage);
            session.save();

            res.json(replyMessage);
        });

    // Qa CURD
    router.route('/qa')

        // create a qa
        .post((req, res) => {

            let qa = new Qa(req.body);      // create a new instance of the Qa model

            // save the qa and check for errors
            qa.save().then(qa => {
                res.json(qa);
                // TODO index in elasticsearch
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
                    size: limit,
                    from: skip,
                    body: {
                        query: {
                            function_score: {
                                query: {
                                    multi_match: {
                                        query: req.query.q,
                                        fields: ['q', 'tags', 'cat']
                                    }
                                },
                                field_value_factor: {
                                    field: 'rating',
                                    modifier: 'none',
                                    factor: 1,
                                    missing: 0
                                },
                                boost_mode: 'sum'
                            }
                        }
                    }
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
                if (!qa) {
                    res.status(404).send('Qa not found.');
                    throw `Qa not found: ${req.params.qaId}.`;
                }
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
