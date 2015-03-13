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

var bootstrap = function (options) {
  var app = express();

  app.oauth = oauth2server({
    model: {
      getAccessToken: function (token, callback) {
        var expires = new Date(Date.now() * 2);

        callback(false, { expires: expires });
      },
      authoriseScope: function (accessToken, scope, cb) {
        cb(false, 'my-scope' !== scope);
      }
    }
  });

  app.use(bodyParser());

  app.get('/', app.oauth.authorise(), app.oauth.scope(options), function (req, res) {
    res.send('nightworld');
  });

  app.use(app.oauth.errorHandler());

  return app;
};

describe('Scope', function () {

  it('should not allow if not authorized', function (done) {
    var app = bootstrap('foobar');

    app.get('/unauthorised', app.oauth.scope('foobar'), function (req, res) {
      res.send('nightworld');
    });

    app.use(app.oauth.errorHandler());

    request(app)
      .get('/unauthorised')
      .expect(400, /invalid_request/, done);
  });

  it('should not allow if scope is invalid', function (done) {
    var app = bootstrap('foobar');

    request(app)
      .get('/?access_token=thom')
      .expect(400, /invalid_scope/, done);
  });

  it('should allow if scope is valid', function (done) {
    var app = bootstrap('my-scope');

    request(app)
      .get('/?access_token=thom')
      .expect(200, /nightworld/, done);
  });

});
