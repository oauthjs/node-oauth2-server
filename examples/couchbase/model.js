/**
 * Created by deefactorial on 05/01/16.
 */
var model = module.exports,
    couchbase = require('couchbase'),
    serverAddress = '127.0.0.1',
    cluster = new couchbase.Cluster('couchbase://' + serverAddress),
    oauth2Server = cluster.openBucket('oauth2Server');

/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
    console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');
    oauth2Server.get('atkn::' + bearerToken, function(err, token){
        if(err){
            if(err.code == 13){
                callback(null, null);
            } else {
                callback(err, null);
            }
        } else {
            if(typeof token.value.expires != 'undefined' && token.value.expires != null){
                token.value.expires = new Date(token.value.expires);
            }
            callback(null, token.value);
        }
    });
};

// db will do cleanup of the document when it expires
model.saveAccessToken = function (accessToken, clientId, expires, userId, callback) {
    console.log('in saveAccessToken (token: ' + accessToken + ', clientId: ' + clientId + ', userId: ' + JSON.stringify(userId) + ', expires: ' + expires + ')');
    var oauthAccessToken = {};
    oauthAccessToken.accessToken = accessToken;
    oauthAccessToken.clientId = clientId;
    if(typeof userId !== 'undefined' && typeof userId.id !== 'undefined' ){
        oauthAccessToken.user = userId;
    } else {
        oauthAccessToken.userId = userId;
    }
    oauthAccessToken.expires = expires;
    oauth2Server.insert('atkn::' + accessToken, oauthAccessToken, { expires: expires }, function(err, ok){
        if(err){
            callback(err);
        } else {
            callback(null);
        }
    });
};

model.getRefreshToken = function (bearerToken, callback) {
    console.log('in getRefreshToken (bearerToken: ' + bearerToken + ')');
    oauth2Server.get('rtkn::' + bearerToken, function(err, token){
        if(err){
            if(err.code == 13){
                callback(null, null);
            } else {
                callback(err, null);
            }
        } else {
            if(typeof token.value.expires != 'undefined' && token.value.expires != null){
                token.value.expires = new Date(token.value.expires);
            }
            callback(null, token.value);
        }
    });
};

// db will do cleanup of the document when it expires
model.saveRefreshToken = function (refreshToken, clientId, expires, userId, callback) {
    console.log('in saveRefreshToken (token: ' + refreshToken + ', clientId: ' + clientId +', userId: ' + JSON.stringify(userId) + ', expires: ' + expires + ')');
    var oauthRefreshToken = {};
    oauthRefreshToken.refreshToken = refreshToken;
    oauthRefreshToken.clientId = clientId;
    if(typeof userId !== 'undefined' && typeof userId.id !== 'undefined' ){
        oauthRefreshToken.user = userId;
    } else {
        oauthRefreshToken.userId = userId;
    }
    oauthRefreshToken.expires = expires;
    oauth2Server.insert('rtkn::' + refreshToken, oauthRefreshToken, { expires: expires }, function(err, ok){
        if(err){
            callback(err);
        } else {
            callback(null);
        }
    });
};

model.getClient = function (clientId, clientSecret, callback) {
    console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
    oauth2Server.get('clnt::' + clientId, function(err, client){
        if(err){
            if(err.code == 13){
                callback(null,null);
            } else {
                callback(err, null);
            }
        } else {
            if(client.value.clientSecret === null || client.value.clientSecret === clientSecret){
                callback(null, client.value)
            } else {
                callback(null,null);
            }
        }
    });
};

model.grantTypeAllowed = function (clientId, grantType, callback) {
    console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');
    oauth2Server.get('gtype::' + grantType, function(err, clientIds){
        if(err){
            if(err.code == 13){
                callback(null,null);
            } else {
                callback(err, null);
            }
        } else {
            callback(null, clientIds.value.indexOf(clientId) >= 0)
        }
    });
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
    console.log('in getUser (username: ' + username + ', password: ' + password + ')');
    oauth2Server.get('usr::' + username, function(err, user){
        if(err){
            if(err.code == 13){
                callback(null, null);
            } else {
                callback(err, null);
            }
        } else {
            //TODO: implement bcrypt
            if(user.value.password === password){
                callback(null, user.value);
            } else {
                callback(null, null);
            }
        }
    });
};

/*
 * Required to support auth Code Grant Type
 */

model.saveAuthCode = function (authCode, clientId, expires, user, callback) {
    console.log('in saveAuthCode (authCode: ' + authCode + ', clientId: ' + clientId + ', expires: ' + expires + ', user: ' + JSON.stringify(user) + ')');
    var code = {};
    code.authCode = authCode;
    code.clientId = clientId;
    code.expires = expires;
    code.user = user;
    oauth2Server.insert('acode::' + authCode, code, {expires: expires}, function(err, ok){
        if(err){
            callback(err);
        } else {
            callback(null);
        }
    });
};

model.getAuthCode = function(code, callback){
    console.log('in getAuthCode (authCode: ' + code + ')');
    oauth2Server.get('acode::' + code, function(err, authCode){
        if(err){
            if(err.code == 13){
                callback(false, null);
            } else {
                callback(err, null);
            }
        } else {
            //if the authCode has expired return null for expires
            if(typeof authCode.value.expires != 'undefined' && new Date(authCode.value.expires).getTime() < new Date()){
                authCode.value.expires = null;
            } else if(typeof authCode.value.expires != 'undefined') {
                authCode.value.expires = new Date(authCode.value.expires);
            }
            callback(null, authCode.value);
        }
    });
};

/*
 * Optional to save user data
 */

model.saveUser = function(username, password, callback) {
    console.log('in saveUser (username: ' + username + ', password: ' + password + ')');
    var user = {};
    user.id = username;
    user.username = username;
    user.password = password;
    oauth2Server.insert('usr::' + user.username, user, function(err, ok){
        if(err){
            callback(err,null);
        } else {
            callback(null, ok);
        }
    });
};

/*
 * Optional to save client data
 */

model.saveClient = function(clientId, clientSecret, redirectUri, callback) {
    console.log('in saveClient (clientId: ' + clientId + ', clientSecret:' + clientSecret + ', redirectUri: ' + redirectUri + ')');
    var client = {};
    client.clientId = clientId;
    client.clientSecret = clientSecret;
    client.redirectUri = redirectUri;
    oauth2Server.insert('clnt::' + client.clientId, client, function(err, ok){
        if(err){
            callback(err, null);
        } else {
            callback(null, ok);
        }
    });
};

/*
 * Optional to save authorized clients
 */

model.saveAuthorizedClientIds = function(grantType, clientId, callback){
    console.log('in saveAuthroizedClientIds (grantType: ' + grantType + ', clientId: ' + clientId + ')');
    oauth2Server.get('gtype::' + grantType, function(err, passwordList){
        if(err){
            if(err.code == 13) {
                oauth2Server.insert('gtype::' + grantType, [clientId], function(err, ok){
                    if(err){
                        callback(err, null);
                    } else {
                        callback(null, ok);
                    }
                });
            } else {
                callback(err, null);
            }
        } else {
            //check if client is in list
            if(passwordList.value.indexOf(clientId) === -1){
                //add to list and save
                passwordList.value.push(clientId);
                oauth2Server.replace('gtype::' + grantType, passwordList.value, {cas: passwordList.cas}, function(err, ok){
                    if(err){
                        callback(err, null);
                    } else {
                        callback(null, ok);
                    }
                });
            } else {
                callback(null, passwordList.value);
            }
        }
    });
};

/*
 * Optional to expire refresh tokens
 */

model.expireRefreshToken = function (refreshToken, callback) {
    console.log('in expirerefreshToken (refreshToken: ' + refreshToken + ')');
    oauth2Server.remove('rtkn::' + refreshToken, function(err, ok){
        if(err){
            callback(err);
        } else {
            callback(null);
        }
    })
};

/*
 * Optional to support the extended grant type
 */

model.extendedGrant = function (grantType, req, callback) {
    console.log('in extendedGrant (grantType: ' + grantType + ', req.oauth:' + JSON.stringify(req.oauth) + ', req.body: ' + JSON.stringify(req.body) + ')');
    if(grantType === 'http://custom.com'){
        oauth2Server.get('etkn::' + req.body.extended_token, function(err, extended){
            if(err){
                callback(err, null, null);
            } else {
                callback(null, true, extended.value.user);
            }
        });
    } else {
        callback(null,null,null);
    }
};

/*
 * Optional to save extended token
 */

model.saveExtendedToken = function(token, clientId, expires, user, callback) {
    var code = {};
    code.token = token;
    code.clientId = clientId;
    code.expires = expires;
    code.user = user;
    oauth2Server.insert('etkn::' + token, code, {expires: expires}, function(err, ok){
        if(err){
            callback(err);
        } else {
            callback(null);
        }
    });
};

/*
 * Optional to generate access token
 */

model.generateToken = function (type, req, callback) {
    console.log('in generateToken (type: ' + type + ', req.oauth:' + JSON.stringify(req.oauth) + ', req.user: ' + JSON.stringify(req.user) + ')');
    callback(null, getRandomString(40));
};

function getRandomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}


// Debug function to dump the state of the data stores
model.dump = function() {
    var N1qlQuery = couchbase.N1qlQuery;
    oauth2Server.enableN1ql(['http://' + serverAddress + ':8093/']);
    var query = N1qlQuery.fromString('SELECT * FROM oauth2Server;');
    oauth2Server.query(query, function(err, results) {
        if (err) {
            console.log(err);
        } else {
            var response = [];
            for(i in results) {
                response.push(results[i].oauth2Server);
            }
            console.log('oauth2Server:', response);
        }
    });
};