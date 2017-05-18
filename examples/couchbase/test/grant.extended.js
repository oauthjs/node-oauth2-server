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
  should = require('should'),
  model = require('../model')

var oauth2server = require('../../../');

var bootstrap = function (oauthConfig) {
  var app = express(),
    oauth = oauth2server(oauthConfig || {
      model: model,
      grants: ['password', 'refresh_token']
    });

  app.set('json spaces', 0);
  app.use(bodyParser());

  app.all('/oauth/token', oauth.grant());

  app.use(oauth.errorHandler());

  return app;
};

describe('Granting with extended grant type', function () {
  it('should ignore if no extendedGrant method', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('http://unsupported.com', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            var app = bootstrap({
              model: model,
              grants: ['http://unsupported.com']
            });

            request(app)
                .post('/oauth/token')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  grant_type: 'http://unsupported.com',
                  client_id: client.clientId,
                  client_secret: client.clientSecret
                })
                .expect(400, /invalid grant_type/i, done);
          }
        });
      }
    });

  });

  it('should still detect unsupported grant_type', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('http://unsupported.com', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {

            var app = bootstrap({
              model: model,
              grants: ['http://unsupported.com']
            });

            request(app)
                .post('/oauth/token')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  grant_type: 'http://unsupported.com',
                  client_id: client.clientId,
                  client_secret: client.clientSecret
                })
                .expect(400, /invalid grant_type/i, done);
          }
        });
      }
    });

  });

  it('should require a user.id', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('http://custom.com', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            var extendedToken = {};
            extendedToken.token = 'clientExtendedToken' + new Date().getTime();
            extendedToken.user = {id: 'username', username: 'username'};
            extendedToken.expires = null;
            extendedToken.clientId = client.clientId;

            model.saveExtendedToken(extendedToken.token, extendedToken.clientId, extendedToken.expires, extendedToken.user, function (err) {
              if (err) {
                console.log(err);
                done();
              } else {
                var app = bootstrap({
                  model: model,
                  grants: ['http://custom.com']
                });

                request(app)
                    .post('/oauth/token')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send({
                      grant_type: 'http://custom.com',
                      client_id: client.clientId,
                      client_secret: client.clientSecret,
                      extended_token: extendedToken.token
                    })
                    .expect(200, /access_token/i, done);
              }
            });
          }
        });
      }
    });
  });

  it('should passthrough valid request', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, { clientId: 'thom', clientSecret: 'nightworld' });
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        extendedGrant: function (grantType, req, callback) {
          req.oauth.client.clientId.should.equal('thom');
          req.oauth.client.clientSecret.should.equal('nightworld');
          callback(false, true, { id: 3 });
        },
        saveAccessToken: function (token, clientId, expires, user, cb) {
          cb();
        },
      },
      grants: ['http://custom.com']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'http://custom.com',
        client_id: 'thom',
        client_secret: 'nightworld'
      })
      .expect(200, done);
  });

  it('should allow any valid URI valid request', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        extendedGrant: function (grantType, req, callback) {
          callback(false, true, { id: 3 });
        },
        saveAccessToken: function (token, clientId, expires, user, cb) {
          cb();
        },
      },
      grants: ['urn:custom:grant']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'urn:custom:grant',
        client_id: 'thom',
        client_secret: 'nightworld'
      })
      .expect(200, done);
  });
});
