var couchbase = require('couchbase'),
    serverAddress = '127.0.0.1',
    cluster = new couchbase.Cluster('couchbase://' + serverAddress),
    clusterManager = cluster.manager('Administrator', 'Password'),
    N1qlQuery = couchbase.N1qlQuery,
    model = {},
    async = require('async'),
    tasks = {};


tasks.create_bucket = function(callback){
    //Create the bucket
    clusterManager.createBucket('oauth2Server', {}, function(err, results){
        if(err){
            callback("CREATE BUCKET ERROR:" + err, null);
        } else {
            callback(null,"Successfully created oauth2-server bucket.");
        }
    });
};

tasks.create_index = function(callback){
    //give couchbase a couple seconds to initialize the db.
    setTimeout(function(){
        //connect the model.
        model = require('./model');

        //Open the bucket
        var oauth2Server = cluster.openBucket('oauth2Server');
        oauth2Server.enableN1ql(['http://' + serverAddress + ':8093/']);

        //Create the primary index on the bucket to query the bucket for model.dump
        var queryString = "CREATE PRIMARY INDEX `#primary` ON `oauth2Server` USING GSI;";
        var query = N1qlQuery.fromString(queryString);
        oauth2Server.query(query, function(err, doc){
            if(err) {
                callback("CREATE PRIMARY INDEX ERROR:" + err, null);
            } else {
                callback(null, "Successfully created index.");
            }
        });
    }, 3000);
};

//Stored Data
var user = {};
user.id = "username";
user.username = "username";
user.password = "password";

var client = {};
client.clientId = 'clientName';
client.clientSecret = null;
client.redirectUri = 'http://clientapp.com';

var accessToken = {};
accessToken.accessToken = 'clientToken';
accessToken.user = { id: user.id, name: user.username };
accessToken.expires = new Date();
accessToken.expires.setSeconds(accessToken.expires.getSeconds() + 60 * 15); //15 minutes
accessToken.clientId = client.clientId;

var refreshToken = {};
refreshToken.refreshToken = 'clientRefresh';
refreshToken.user = { id: user.id, name: user.username };
refreshToken.expires = new Date();
refreshToken.expires.setSeconds(refreshToken.expires.getSeconds() + 60 * 60); //1hr
refreshToken.clientId = client.clientId;

//Saving the data
tasks.save_user = function(callback) {
    model.saveUser(user.username, user.password, function (err, ok) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, ok);
        }
    });
};

tasks.save_client = function(callback) {
    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok){
        if(err){
            callback(err, null);
        } else {
            callback(null, ok);
        }
    });
};

tasks.save_auth_clients = function(callback) {
    model.saveAuthorizedClientIds("password", client.clientId, function(err, ok){
        if(err){
            callback(err, null);
        } else {
            callback(null, ok);
        }
    });
};

tasks.save_refresh_clients = function(callback) {
    model.saveAuthorizedClientIds("refresh", client.clientId, function(err, ok){
        if(err){
            callback(err, null);
        } else {
            callback(null, ok);
        }
    });
};

tasks.save_access_token = function(callback) {
    model.saveAccessToken(accessToken.accessToken, accessToken.clientId, accessToken.expires, accessToken.user, function(err){
        if(err){
            callback(err, null);
        } else {
            callback(null, "Saved Access Token:" + accessToken.accessToken);
        }
    });
};

tasks.save_refresh_token = function(callback) {
    model.saveRefreshToken(refreshToken.refreshToken, refreshToken.clientId, refreshToken.expires, refreshToken.user, function(err){
        if(err){
            callback(err, null);
        } else {
            callback(null, "Saved Refresh Token:" + refreshToken.refreshToken);
        }
    });
};

async.series(tasks, function(err, results){
    if(err){
        console.log(err);
    } else {
        console.log(results);
    }
    process.exit();
});


