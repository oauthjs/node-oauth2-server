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
  request = require('supertest'),
  should = require('should');

var oauth2server = require('../');

var bootstrap = function (oauthConfig) {
  var app = express(),
    oauth = oauth2server(oauthConfig || {
      model: {},
      grants: ['client_credentials']
    });

  app.set('json spaces', 0);
  app.use(express.bodyParser());

  app.all('/oauth/token', oauth.grant());

  app.use(oauth.errorHandler());

  return app;
};

describe('Granting with client_credentials grant type', function () {
  it('should detect missing parameters', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        }
      },
      grants: ['client_credentials']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials'
      })
      .expect(400, /or missing client_id parameter/i, done);

  });

  it('should detect invalid user', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getUser: function (uname, pword, callback) {
          uname.should.equal('thom');
          pword.should.equal('nightworld');
          callback(false, false); // Fake invalid user
        }
      },
      grants: ['client_credentials']
    });

    request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'client_credentials'
      })
      .set('Authorization', 'Basic dGhvbTpuaWdodHdvcmxk')
      .expect(400, /user credentials are invalid/i, done);

  });
});