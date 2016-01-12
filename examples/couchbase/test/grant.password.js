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

describe('Granting with password grant type', function () {
  it('should detect missing parameters', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            var app = bootstrap({
              model: model,
              grants: ['password']
            });

            request(app)
                .post('/oauth/token')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  grant_type: 'password',
                  client_id: client.clientId,
                  client_secret: client.clientSecret
                })
                .expect(400, /missing parameters. \\"username\\" and \\"password\\"/i, done);
          }
        });
      }
    });


  });

  it('should detect invalid user', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = 'password' + new Date().getTime();
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        model.saveAuthorizedClientIds('password', client.clientId, function (err, ok) {
          if (err) {
            console.log(err);
            done();
          } else {
            var app = bootstrap({
              model: model,
              grants: ['password']
            });

            request(app)
                .post('/oauth/token')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({
                  grant_type: 'password',
                  client_id: client.clientId,
                  client_secret: client.clientSecret,
                  username: 'thomseddon',
                  password: 'nightworld'
                })
                .expect(400, /user credentials are invalid/i, done);
          }
        });
      }
    });

  });
});
