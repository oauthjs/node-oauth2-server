/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var dal = require('./dal.js');
model = module.exports;

var OAuthAccessTokenTable = "oauth2accesstoken";
var OAuthRefreshTokenTable = "oauth2refreshtoken";
var OAuthClientTable = "oauth2client";
var OAuthUserTable = "userid_map";

//
// node-oauth2-server callbacks
//
model.getAccessToken = function (bearerToken, callback) {
    console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

    dal.doGet(OAuthAccessTokenTable,
        {"accessToken": {"S": bearerToken}}, true, function(err, data) {
            if (data && data.expires) {
                data.expires = new Date(data.expires * 1000);
            }
            callback(err, data);
        });
};

model.getClient = function (clientId, clientSecret, callback) {
    console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
    dal.doGet(OAuthClientTable,
        {"clientId": {"S": clientId}, "clientSecret": {"S": clientSecret}},
        true, callback);
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to restrict certain grant types
var authorizedClientIds = ['abc1', 'def2'];
model.grantTypeAllowed = function (clientId, grantType, callback) {
    console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');

    if (grantType === 'password') {
        callback(false, authorizedClientIds.indexOf(clientId) >= 0);
        return;
    }

    callback(false, true);
};

model.saveAccessToken = function (accessToken, clientId, expires, user, callback) {
    console.log('in saveAccessToken (accessToken: ' + accessToken + ', clientId: ' + clientId + ', userId: ' + user.id + ', expires: ' + expires + ')');

    var token = {};
    token.accessToken = accessToken;
    token.clientId = clientId;
    token.userId = user.id;
    if (expires)
        token.expires = parseInt(expires.getTime()/1000);
    console.log("saving", token);

    dal.doSet(token, OAuthAccessTokenTable, {"accessToken": {"S": accessToken}}, callback);
};

model.saveRefreshToken = function (refreshToken, clientId, expires, user, callback) {
    console.log('in saveRefreshToken (refreshToken: ' + refreshToken + ', clientId: ' + clientId + ', userId: ' + user.id + ', expires: ' + expires + ')');

    var token = {};
    token.refreshToken = refreshToken;
    token.clientId = clientId;
    token.userId = user.id;
    if (expires)
        token.expires = parseInt(expires.getTime()/1000);
    console.log("saving", token);

    dal.doSet(token, OAuthRefreshTokenTable, {"refreshToken": {"S": refreshToken}}, callback);
};

model.getRefreshToken = function (bearerToken, callback) {
    console.log("in getRefreshToken (bearerToken: " + bearerToken + ")");

    dal.doGet(OAuthRefreshTokenTable,
        {"refreshToken": {"S": bearerToken}}, true, function(err, data) {
            if (data && data.expires) {
                data.expires = new Date(data.expires * 1000);
            }
            callback(err, data);
        });
};

model.revokeRefreshToken = function(bearerToken, callback) {
    console.log("in revokeRefreshToken (bearerToken: " + bearerToken + ")");
    
    dal.doDelete(OAuthRefreshTokenTable,
        {"refreshToken": {"S": bearerToken}}, callback);
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
    console.log('in getUser (username: ' + username + ', password: ' + password + ')');

    dal.doGet(OAuthUserTable,
        {"id": {"S": "email:" + username}}, true, function(err, data) {
            if (err) {
                callback(err);
                return;
            }
            var userId = data.userId;
            callback(null, {id: userId});
        });
};