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
  var app = express();
  app.oauth = oauth2server(oauthConfig || {
      model: {}
    });

  app.use(bodyParser());

  app.all('/oauth/token', app.oauth.grant);

  app.all('/private', function (req, res, next) {
    res.send('Hello');
  });

  app.all('/public', app.oauth.bypass, function (req, res, next) {
    res.send('Hello');
  });


  app.oauth.lockdown(app);

  app.use(app.oauth.errorHandler());

  return app;
};

describe('Lockdown pattern', function() {

  it('should substitute grant', function (done) {
    var app = bootstrap();

    request(app)
      .get('/oauth/token')
      .expect(400, /method must be POST/i, done);
  });

  it('should insert authorise by default', function (done) {
    var app = bootstrap();

    request(app)
      .get('/private')
      .expect(400, /access token was not found/i, done);
  });

  it('should pass valid request through authorise', function (done) {
    var app = bootstrap({
      model: {
        getAccessToken: function (token, callback) {
          callback(token !== 'thom', { access_token: token, expires: null });
        }
      }
    });

    request(app)
      .get('/private?access_token=thom')
      .expect(200, /hello/i, done);
  });

  it('should correctly bypass', function (done) {
    var app = bootstrap();

    request(app)
      .get('/public')
      .expect(200, /hello/i, done);
  });
});
