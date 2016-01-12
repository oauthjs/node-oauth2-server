/**
 * Created by deefactorial on 05/01/16.
 */
var express = require('express'),
    bodyParser = require('body-parser'),
    oauthserver = require('../../');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

var couchbaseModel = require('./model');

app.oauth = oauthserver({
    model: couchbaseModel,
    grants: ['password','refresh_token'],
    debug: true
});

app.all('/oauth/token', app.oauth.grant());

app.get('/secret', app.oauth.authorise(), function (req, res) {
    // Will require a valid access_token
    res.send('Secret area');
});

app.get('/public', function (req, res) {
    // Does not require an access_token
    res.send('Public area');
});

app.get('/', app.oauth.authorise(), function (req, res) {
    res.send('Secret area');
});

app.use(app.oauth.errorHandler());

app.listen(3000);

couchbaseModel.dump();