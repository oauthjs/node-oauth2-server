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
var OAuthClientTable = "oauth2client";
var OAuthUserTable = "oauth2user";

//
// node-oauth2-server callbacks
//
model.getAccessToken = function (bearerToken, callback) {
    console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

    dal.doGet(OAuthAccessTokenTable,
        {"access_token": {"S": bearerToken}}, true, callback);
};

model.getClient = function (clientId, clientSecret, callback) {
    console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
    dal.doGet(OAuthClientTable,
        {"client_id": {"S": clientId}, "client_secret": {"S": clientSecret}},
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

model.saveAccessToken = function (accessToken, clientId, userId, expires, callback) {
    console.log('in saveAccessToken (accessToken: ' + accessToken + ', clientId: ' + clientId + ', userId: ' + userId + ', expires: ' + expires + ')');

    var token = {};
    token.access_token = accessToken;
    token.client_id = clientId;
    token.user_id = userId;
    token.expires = expires.getTime()/1000; // store as a unix timestamp

    dal.doSet(token, OAuthAccessTokenTable, {"access_token": {"S": accessToken}}, callback);
};

/*
 * Required to support password grant type
 */
//This will probably just be a hook into your existing user database but
//must return an object with a numeric or string `id` property
model.getUser = function (username, password, callback) {
    console.log('in getUser (username: ' + username + ', password: ' + password + ')');

    dal.doGet(OAuthUserTable,
        {"username": {"S": username}, "password": {"S": password}}, true, function(err, data) {
            if (err) {
                callback(err);
                return;
            }
            
            callback({id: data.username});
        });
};