const authenticate = require('../middlewares/authenticate');
const cors = require('cors');

module.exports = (app, router, io) => {
    // register routes
    router = require('./auth.js')(router);
    router = require('./qa.js')(router);
    router = require('./user.js')(router);
    router = require('./wechat.js')(router);
    app.use('/api', cors({exposedHeaders:['items-total', 'items-start', 'items-end']}), authenticate, router);
};
