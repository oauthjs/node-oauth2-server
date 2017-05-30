// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var oauthserver = require('oauth2-server');
var couchbase = require('couchbase');
var config = require('./config');
var app = express();

// Express configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Global declaration of Couchbase
module.exports.bucket = (new couchbase.Cluster(config.couchbase.server)).openBucket(config.couchbase.bucket, config.couchbase.password);

// Install Couchbase design documents
argv = process.argv.splice(2);
if (argv[0] === '--setup') {
    var design = require('./setup.js');
    design.setup(function(error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
        }
        process.exit(0);
    });
}
else {
    // OAuth 2 configuration
    app.oauth = oauthserver({
        model: require('./models/oauth'),
        grants: ['authorization_code', 'password', 'refresh_token'],
        accessTokenLifetime: config.oauth.accessTokenLifetime,
        refreshTokenLifetime: config.oauth.refreshTokenLifetime,
        debug: false
    });
    module.exports.oauth = app.oauth;
    app.all('/oauth/token', app.oauth.grant());

    // API endpoints
    app.get('/secret', app.oauth.authorise(), function (req, res) {
        // Will require a valid access_token
        res.send('Secret area');
    });
    // Error handling
    app.use(app.oauth.errorHandler());
    app.use(function(req, res) {
      res.status(403).send("Not a valid API endpoint");
    });
}

module.exports = app;app.listen(3000);
