var express = require('express'),
    oauthserver = require('../../'); // This would just be: require('node-oauth2-server');

var app = express();

app.configure(function() {
    var oauth = oauthserver({
        model: require('./model'),
        grants: ['password'],
        debug: true
    });
    app.use(express.bodyParser());
    app.use(oauth.handler());
    app.use(oauth.errorHandler());
});

app.get('/', function (req, res) {
    res.send('Secret area');
});

app.listen(3000);