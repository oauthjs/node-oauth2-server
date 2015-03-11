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

var pg = require('pg'),
  model = module.exports,
  connString = process.env.DATABASE_URL;

/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('SELECT access_token, scope, client_id, expires, user_id FROM oauth_access_tokens ' +
        'WHERE access_token = $1', [bearerToken], function (err, result) {
      if (err || !result.rowCount) return callback(err);
      // This object will be exposed in req.oauth.token
      // The user_id field will be exposed in req.user (req.user = { id: "..." }) however if
      // an explicit user object is included (token.user, must include id) it will be exposed
      // in req.user instead
      var token = result.rows[0];
      callback(null, {
        accessToken: token.access_token,
        clientId: token.client_id,
        expires: token.expires,
        userId: token.userId,
		scope: token.scope.split(' ') // Assumes a flat, space-separated scope string 
      });
      done();
    });
  });
};

model.getClient = function (clientId, clientSecret, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);

    client.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE ' +
      'client_id = $1', [clientId], function (err, result) {
      if (err || !result.rowCount) return callback(err);

      var client = result.rows[0];

      if (clientSecret !== null && client.client_secret !== clientSecret) return callback();

      // This object will be exposed in req.oauth.client
      callback(null, {
        clientId: client.client_id,
        clientSecret: client.client_secret
      });
      done();
    });
  });
};

model.getRefreshToken = function (bearerToken, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
	// Note: To avoid replicating the scope string in both token tables, the old
	// access token's scope string must be retrieved and passed along from here.
	client.query('SELECT rt.refresh_token, rt.client_id, rt.expires, rt.user_id, at.scope FROM ' +
        'oauth_refresh_tokens AS rt, oauth_access_tokens AS at WHERE rt.user_id = ' +
		'at.user_id AND rt.client_id = at.client_id AND rt.refresh_token = $',
		[bearerToken], function (err, result) {
	  callback(err, result.rowCount ? result.rows[0] : false);
	});
  });
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
var authorizedClientIds = ['abc1', 'def2'];
model.grantTypeAllowed = function (clientId, grantType, callback) {
  if (grantType === 'password') {
    return callback(false, authorizedClientIds.indexOf(clientId.toLowerCase()) >= 0);
  }

  callback(false, true);
};

model.saveAccessToken = function (accessToken, clientId, expires, userId, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('INSERT INTO oauth_access_tokens(access_token, client_id, user_id, expires) ' +
        'VALUES ($1, $2, $3, $4)', [accessToken, clientId, userId, expires],
        function (err, result) {
      callback(err);
      done();
    });
  });
};

model.saveRefreshToken = function (refreshToken, clientId, expires, userId, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('INSERT INTO oauth_refresh_tokens(refresh_token, client_id, user_id, ' +
        'expires) VALUES ($1, $2, $3, $4)', [refreshToken, clientId, userId, expires],
        function (err, result) {
      callback(err);
      done();
    });
  });
};

model.saveScope = function (scope, accessToken, callback) {
  // Here you will want to validate that what the client is soliciting
  // makes sense. You might then proceed by storing the validated scope.
  // In this example, the scope is simply stored as a string in the
  // oauth_access_tokens table, but you could also handle them as entries
  // in a connection table.
  var acceptedScope = scope;

  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
	client.query('UPDATE oauth_access_tokens SET scope=$1 WHERE access_token = $2',
        [acceptedScope, accessToken], function (err, result) {
     callback(err, acceptedScope); 
	 done();
  });
};

model.checkScope = function (accessToken, requiredScope, callback)
  // requiredScope is set through the scope middleware.
  // You may pass anything from a simple string, as this example illustrates,
  // to representations including scopes and subscopes such as
  // { "account": [ "edit" ] }
  if(accessToken.scope.indexOf(requiredScope) === -1) {
    return callback('Required scope: ' + requiredScope);
  }
  callback();
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
  pg.connect(connString, function (err, client, done) {
    if (err) return callback(err);
    client.query('SELECT id FROM users WHERE username = $1 AND password = $2', [username,
        password], function (err, result) {
      callback(err, result.rowCount ? result.rows[0] : false);
      done();
    });
  });
};
