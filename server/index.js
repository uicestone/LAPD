'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const compression = require('compression');
const mongoose    = require('mongoose');
const app         = express();
const router      = express.Router();
const httpServer  = require('http').createServer(app);
const io          = require('socket.io')(httpServer);
const env         = require('node-env-file');
const cors        = require('cors');
const fs          = require('fs');

env(`${__dirname}/../.env`);

mongoose.connect(process.env.MONGODB_URL);
mongoose.Promise = global.Promise;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.query());
app.use(compression());

require(`${__dirname}/apis`)(app, router, io);
app.use('/', express.static(`${__dirname}/../web`));
app.use('/admin', express.static(`${__dirname}/../admin/dist`));

const port = process.env.PORT_HTTP;
const portHttps = process.env.PORT_HTTPS;

httpServer.listen(port, () => {
    console.log(`[${new Date()}] HTTP server listening port: ${port}`);
});

if (process.env.PORT_HTTPS) {
    const ca          = fs.readFileSync(process.env.CA_PATH, 'utf8');
    const privateKey  = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
    const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
    const credentials = {ca: ca, key: privateKey, cert: certificate};
    const httpsServer = require('https').createServer(credentials, app);
    httpsServer.listen(portHttps, function() {
        console.log('[' + new Date() + '] HTTPS server listening port:', portHttps);
    });
}

io.on('connect', socket => {
    console.log(`[${new Date()}] socket ${socket.conn.remoteAddress} connected`);
    socket.on('disconnect', reason => {
        console.log(`[${new Date()}] socket ${socket.conn.remoteAddress} disconnected: ${reason}`);
    }).on('join', data => {
        socket.join(data);
        console.log(`[${new Date()}] socket ${socket.conn.remoteAddress} joined: ${data}`);
    }).on('leave', data => {
        socket.leave(data);
        console.log(`[${new Date()}] socket ${socket.conn.remoteAddress} left: ${data}`);
    });
});
