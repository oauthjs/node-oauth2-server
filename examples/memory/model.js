var model = module.exports;

// In-memory datastores:
var oauthAccessTokens = [],
  oauthRefreshTokens = [],
  oauthClients = [
    {
      client_id : 'thom',
      client_secret : 'nightworld',
      redirect_uri : ''
    }
  ],
  authorizedClientIds = {
    password: [
      'thom'
    ],
    refresh_token: [
      'thom'
    ]
  },
  users = [
    {
      id : '123',
      username: 'thomseddon',
      password: 'nightworld'
    }
  ];

// Debug function to dump the state of the data stores
model.dump = function() {
  console.log('oauthAccessTokens', oauthAccessTokens);
  console.log('oauthClients', oauthClients);
  console.log('authorizedClientIds', authorizedClientIds);
  console.log('oauthRefreshTokens', oauthRefreshTokens);
  console.log('users', users);
};

/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
  for(var i = 0, len = oauthAccessTokens.length; i < len; i++) {
    var elem = oauthAccessTokens[i];
    if(elem.access_token === bearerToken) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.getRefreshToken = function (bearerToken, callback) {
  for(var i = 0, len = oauthRefreshTokens.length; i < len; i++) {
    var elem = oauthRefreshTokens[i];
    if(elem.refresh_token === bearerToken) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.getClient = function (clientId, clientSecret, callback) {
  for(var i = 0, len = oauthClients.length; i < len; i++) {
    var elem = oauthClients[i];
    if(elem.client_id === clientId && elem.client_secret === clientSecret) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};

model.grantTypeAllowed = function (clientId, grantType, callback) {
  callback(false, authorizedClientIds[grantType] &&
    authorizedClientIds[grantType].indexOf(clientId.toLowerCase()) >= 0);
};

model.saveAccessToken = function (accessToken, clientId, userId, expires, callback) {
  oauthAccessTokens.unshift({
    access_token: accessToken,
    client_id: clientId,
    user_id: userId,
    expires: expires
  });

  callback(false);
};

model.saveRefreshToken = function (refreshToken, clientId, userId, expires, callback) {
  oauthRefreshTokens.unshift({
    refresh_token: refreshToken,
    client_id: clientId,
    user_id: userId,
    expires: expires
  });

  callback(false);
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
  for(var i = 0, len = users.length; i < len; i++) {
    var elem = users[i];
    if(elem.username === username && elem.password === password) {
      return callback(false, elem);
    }
  }
  callback(false, false);
};
