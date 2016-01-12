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
  model = require('../model');

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

describe('Granting with authorization_code grant type', function () {

  it('should detect missing parameters', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password';
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('authorization_code', client.clientId,function(err, ok){
          if(err){
            console.log(err);
            done();
          } else {
            var app = bootstrap({
              model: model,
              grants: ['authorization_code']
            });

            request(app)
                .post('/oauth/token')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  grant_type: 'authorization_code',
                  client_id: client.clientId,
                  client_secret: client.clientSecret
                })
                .expect(400, /no \\"code\\" parameter/i, done);
          }
        });
      }
    });
  });

  it('should invalid authorization_code', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password';
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('authorization_code', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            var app = bootstrap({
              model: model,
              grants: ['authorization_code']
            });

            request(app)
                .post('/oauth/token')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  grant_type: 'authorization_code',
                  client_id: client.clientId,
                  client_secret: client.clientSecret,
                  code: 'abc123'
                })
                .expect(400, /invalid code/i, done);
          }
        });
      }
    });
  });

  it('should detect invalid client_id', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password';
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('authorization_code', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {

            var authCode = {};
            authCode.code = 'abc123' + new Date().getTime();
            authCode.clientId = client.clientId;
            authCode.user = { id: 'username' };
            authCode.expires = new Date();
            authCode.expires.setSeconds(authCode.expires.getSeconds() + 20);
            model.saveAuthCode(authCode.code, authCode.clientId, authCode.expires, authCode.user, function(err, ok){
              if(err){
                console.log(err);
                done();
              } else {
                var app = bootstrap({
                  model: model,
                  grants: ['authorization_code']
                });

                request(app)
                    .post('/oauth/token')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send({
                      grant_type: 'authorization_code',
                      client_id: 'thom',
                      client_secret: 'password',
                      code: authCode.code
                    })
                    .expect(400, /Client credentials are invalid/i, done);
              }
            });
          }
        });
      }
    });
  });

  it('should detect expired code', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password';
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('authorization_code', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {

            var authCode = {};
            authCode.code = 'abc123' + new Date().getTime();
            authCode.clientId = client.clientId;
            authCode.user = {id: 'username'};
            authCode.expires = new Date();
            authCode.expires.setSeconds(authCode.expires.getSeconds() - 3600);
            model.saveAuthCode(authCode.code, authCode.clientId, authCode.expires, authCode.user, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {
                var app = bootstrap({
                  model: model,
                  grants: ['authorization_code']
                });

                request(app)
                    .post('/oauth/token')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send({
                      grant_type: 'authorization_code',
                      client_id: client.clientId,
                      client_secret: client.clientSecret,
                      code: authCode.code
                    })
                    .expect(400, /code has expired/i, done);
              }
            });
          }
        });
      }
    });

  });

  it('should require code expiration', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password';
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('authorization_code', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {

            var authCode = {};
            authCode.code = 'abc123' + new Date().getTime();
            authCode.clientId = client.clientId;
            authCode.user = {id: 'username'};
            authCode.expires = new Date();
            authCode.expires.setSeconds(authCode.expires.getSeconds() - 3600);
            model.saveAuthCode(authCode.code, authCode.clientId, authCode.expires, authCode.user, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {
                var app = bootstrap({
                  model: model,
                  grants: ['authorization_code']
                });

                request(app)
                    .post('/oauth/token')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send({
                      grant_type: 'authorization_code',
                      client_id: client.clientId,
                      client_secret: client.clientSecret,
                      code: authCode.code
                    })
                    .expect(400, /code has expired/i, done);
              }
            });
          }
        });
      }
    });
  });


  it('should allow valid request', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password';
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('authorization_code', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {

            var authCode = {};
            authCode.code = 'abc123' + new Date().getTime();
            authCode.clientId = client.clientId;
            authCode.user = {id: 'username'};
            authCode.expires = new Date();
            authCode.expires.setSeconds(authCode.expires.getSeconds() + 20);
            model.saveAuthCode(authCode.code, authCode.clientId, authCode.expires, authCode.user, function (err, ok) {
              if (err) {
                console.log(err);
                done();
              } else {

                var app = bootstrap({
                  model: model,
                  grants: ['authorization_code']
                });

                request(app)
                    .post('/oauth/token')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send({
                      grant_type: 'authorization_code',
                      client_id: client.clientId,
                      client_secret: client.clientSecret,
                      code: authCode.code
                    })
                    .expect(200, /"access_token":"(.*)"/i, done);
              }
            });
          }
        });
      }
    });
  });

});
