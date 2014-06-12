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

var express = require('express'),
  bodyParser = require('body-parser'),
  request = require('supertest'),
  should = require('should');

var oauth2server = require('../');

var bootstrap = function (oauthConfig) {
  var app = express(),
    oauth = oauth2server(oauthConfig || {
      model: {},
      grants: ['password', 'refresh_token']
    });

  app.set('json spaces', 0);
  app.use(bodyParser());

  app.all('/oauth/token', oauth.grant());

  app.use(oauth.errorHandler());

  return app;
};

describe('Granting with refresh_token grant type', function () {
  it('should detect missing refresh_token parameter', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        }
      },
      grants: ['password', 'refresh_token']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'refresh_token',
        client_id: 'thom',
        client_secret: 'nightworld'
      })
      .expect(400, /no \\"refresh_token\\" parameter/i, done);

  });

  it('should detect invalid refresh_token', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getRefreshToken: function (data, callback) {
          callback(false, false);
        }
      },
      grants: ['password', 'refresh_token']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'refresh_token',
        client_id: 'thom',
        client_secret: 'nightworld',
        refresh_token: 'abc123'
      })
      .expect(400, /invalid refresh token/i, done);

  });

  it('should detect wrong client id', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getRefreshToken: function (data, callback) {
          callback(false, { client_id: 'kate' });
        }
      },
      grants: ['password', 'refresh_token']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'refresh_token',
        client_id: 'thom',
        client_secret: 'nightworld',
        refresh_token: 'abc123'
      })
      .expect(400, /invalid refresh token/i, done);

  });

  it('should detect expired refresh token', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, { clientId: 'thom' });
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getRefreshToken: function (data, callback) {
          callback(false, {
            clientId: 'thom',
            expires: new Date(+new Date() - 60)
          });
        }
      },
      grants: ['password', 'refresh_token']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'refresh_token',
        client_id: 'thom',
        client_secret: 'nightworld',
        refresh_token: 'abc123'
      })
      .expect(400, /refresh token has expired/i, done);

  });

  it('should allow valid request', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, { clientId: 'thom' });
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getRefreshToken: function (refreshToken, callback) {
          refreshToken.should.equal('abc123');
          callback(false, {
            clientId: 'thom',
            expires: new Date(),
            userId: '123'
          });
        },
        saveAccessToken: function (token, clientId, expires, user, cb) {
          cb();
        },
        saveRefreshToken: function (token, clientId, expires, user, cb) {
          cb();
        },
        expireRefreshToken: function (refreshToken, callback) {
          callback();
        }
      },
      grants: ['password', 'refresh_token']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'refresh_token',
        client_id: 'thom',
        client_secret: 'nightworld',
        refresh_token: 'abc123'
      })
      .expect(200, /"access_token":"(.*)",(.*)"refresh_token":"(.*)"/i, done);

  });

  it('should allow valid request with user object', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, { clientId: 'thom' });
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getRefreshToken: function (refreshToken, callback) {
          refreshToken.should.equal('abc123');
          callback(false, {
            clientId: 'thom',
            expires: new Date(),
            user: {
              id: '123'
            }
          });
        },
        saveAccessToken: function (token, clientId, expires, user, cb) {
          cb();
        },
        saveRefreshToken: function (token, clientId, expires, user, cb) {
          cb();
        },
        expireRefreshToken: function (refreshToken, callback) {
          callback();
        }
      },
      grants: ['password', 'refresh_token']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'refresh_token',
        client_id: 'thom',
        client_secret: 'nightworld',
        refresh_token: 'abc123'
      })
      .expect(200, /"access_token":"(.*)",(.*)"refresh_token":"(.*)"/i, done);

  });

  it('should allow valid request with non-expiring token (token= null)', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, { clientId: 'thom' });
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getRefreshToken: function (data, callback) {
          callback(false, {
            clientId: 'thom',
            expires: null,
            userId: '123'
          });
        },
        saveAccessToken: function (token, clientId, expires, user, cb) {
          cb();
        },
        saveRefreshToken: function (token, clientId, expires, user, cb) {
          cb();
        },
        expireRefreshToken: function (refreshToken, callback) {
          callback();
        }
      },
      grants: ['password', 'refresh_token']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'refresh_token',
        client_id: 'thom',
        client_secret: 'nightworld',
        refresh_token: 'abc123'
      })
      .expect(200, /"access_token":"(.*)",(.*)"refresh_token":"(.*)"/i, done);

  });
});
