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
  if (oauthConfig === 'model') {
    oauthConfig = {
      model: model
    };
  }

  var app = express();
  app.oauth = oauth2server(oauthConfig || { model: {} });

  app.use(bodyParser());
  app.all('/', app.oauth.authorise());

  app.use(app.oauth.errorHandler());

  return app;
};

describe('Authorise', function() {

  it('should detect no access token', function (done) {
    var app = bootstrap('model');

    app.all('/', function (req, res) {
      res.send('nightworld');
    });

    request(app)
      .get('/')
      .expect(400, /the access token was not found/i, done);
  });

  it('should allow valid token as query param', function (done){

    var accessToken = {};
    accessToken.token = 'clientToken' + new Date().getTime();
    accessToken.user = {id: 'username', username: 'username'};
    accessToken.expires = null;
    accessToken.clientId = 'clientName';

    model.saveAccessToken(accessToken.token, accessToken.clientId, accessToken.expires, accessToken.user, function (err) {
      if (err) {
        console.log(err);
        done();
      } else {
        var app = bootstrap('model');

        app.all('/', function (req, res) {
          res.send('nightworld');
        });

        request(app)
            .get('/?access_token=' + accessToken.token)
            .expect(200, /nightworld/, done);
      }
    });
  });

  it('should require application/x-www-form-urlencoded when access token is ' +
      'in body', function (done) {
    var app = bootstrap('model');

    app.all('/', function (req, res) {
      res.send('nightworld');
    });

    request(app)
      .post('/')
      .send({ access_token: 'clientToken' })
      .expect(400, /content type must be application\/x-www-form-urlencoded/i,
        done);
  });

  it('should not allow GET when access token in body', function (done) {
    var app = bootstrap('model');

    app.all('/', function (req, res) {
      res.send('nightworld');
    });

    request(app)
      .get('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: 'clientToken' })
      .expect(400, /method cannot be GET/i, done);
  });

  it('should allow valid token in body', function (done){
    var accessToken = {};
    accessToken.token = 'clientToken' + new Date().getTime();
    accessToken.user = {id: 'username', username: 'username'};
    accessToken.expires = null;
    accessToken.clientId = 'clientName';

    model.saveAccessToken(accessToken.token, accessToken.clientId, accessToken.expires, accessToken.user, function (err) {
      if (err) {
        console.log(err);
        done();
      } else {
        var app = bootstrap('model');

        app.all('/', function (req, res) {
          res.send('nightworld');
        });

        request(app)
            .post('/')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send({ access_token: accessToken.token })
            .expect(200, /nightworld/, done);
      }
    });
  });

  it('should detect malformed header', function (done) {
    var app = bootstrap('model');

    app.all('/', function (req, res) {
      res.send('nightworld');
    });

    request(app)
      .get('/')
      .set('Authorization', 'Invalid')
      .expect(400, /malformed auth header/i, done);
  });

  it('should allow valid token in header', function (done){
    var accessToken = {};
    accessToken.token = 'clientToken' + new Date().getTime();
    accessToken.user = {id: 'username', username: 'username'};
    accessToken.expires = null;
    accessToken.clientId = 'clientName';

    model.saveAccessToken(accessToken.token, accessToken.clientId, accessToken.expires, accessToken.user, function (err) {
      if (err) {
        console.log(err);
        done();
      } else {
        var app = bootstrap('model');

        app.all('/', function (req, res) {
          res.send('nightworld');
        });

        request(app)
            .get('/')
            .set('Authorization', 'Bearer ' + accessToken.token)
            .expect(200, /nightworld/, done);
      }
    });

  });

  it('should allow exactly one method (get: query + auth)', function (done) {
    var app = bootstrap('model');

    app.all('/', function (req, res) {
      res.send('nightworld');
    });

    request(app)
      .get('/?access_token=clientToken')
      .set('Authorization', 'Invalid')
      .expect(400, /only one method may be used/i, done);
  });

  it('should allow exactly one method (post: query + body)', function (done) {
    var app = bootstrap('model');

    app.all('/', function (req, res) {
      res.send('nightworld');
    });

    request(app)
      .post('/?access_token=clientToken')
      .send({
        access_token: 'thom'
      })
      .expect(400, /only one method may be used/i, done);
  });

  it('should allow exactly one method (post: query + empty body)', function (done) {
    var app = bootstrap('model');

    app.all('/', function (req, res) {
      res.send('nightworld');
    });

    request(app)
      .post('/?access_token=clientToken')
      .send({
        access_token: ''
      })
      .expect(400, /only one method may be used/i, done);
  });

  it('should detect expired token', function (done){
    var accessToken = {};
    accessToken.accessToken = 'expiredToken' + new Date().getTime();
    accessToken.userId = 'username';
    accessToken.expires = 0; // expires now
    accessToken.clientId = 'clientName';

    model.saveAccessToken(accessToken.accessToken, accessToken.clientId, accessToken.expires, accessToken.userId, function(err){
      if(err){
        console.log(err);
        done();
      } else {
        var app = bootstrap('model');

        app.all('/', function (req, res) {
          res.send('nightworld');
        });

        request(app)
            .get('/?access_token=' + accessToken.accessToken)
            .expect(401, /the access token provided has expired/i, done);
      }
    });
  });

  it('should passthrough with valid, non-expiring token (token = null)', function (done) {
    var accessToken = {};
    accessToken.accessToken = 'unexpiredToken' + new Date().getTime();
    accessToken.userId = 'username';
    accessToken.expires = new Date(); // expires now
    accessToken.expires.setSeconds(accessToken.expires.getSeconds() + 20); //add 20 seconds
    accessToken.clientId = 'clientName';

    model.saveAccessToken(accessToken.accessToken, accessToken.clientId, accessToken.expires, accessToken.userId, function(err){
      if(err){
        console.log(err);
        done();
      } else {
        var app = bootstrap('model');

        app.get('/', app.oauth.authorise(), function (req, res) {
          res.send('nightworld');
        });

        app.use(app.oauth.errorHandler());

        request(app)
            .get('/?access_token='+accessToken.accessToken)
            .expect(200, /nightworld/, done);
      }
    });
  });

  it('should expose the user id when setting userId', function (done) {
    var accessToken = {};
    accessToken.accessToken = 'unexpiredToken' + new Date().getTime();
    accessToken.userId = 'username';
    accessToken.expires = new Date(); // expires now
    accessToken.expires.setSeconds(accessToken.expires.getSeconds() + 20); //add 20 seconds
    accessToken.clientId = 'clientName';

    model.saveAccessToken(accessToken.accessToken, accessToken.clientId, accessToken.expires, accessToken.userId, function(err){
      if(err){
        console.log(err);
        done();
      } else {
        var app = bootstrap('model');

        app.get('/', app.oauth.authorise(), function (req, res) {
          req.should.have.property('user');
          req.user.should.have.property('id');
          req.user.id.should.equal('username');
          res.send('nightworld');
        });

        app.use(app.oauth.errorHandler());

        request(app)
            .get('/?access_token='+accessToken.accessToken)
            .expect(200, /nightworld/, done);
      }
    });

  });

  it('should expose the user id when setting user object', function (done) {
    var accessToken = {};
    accessToken.accessToken = 'unexpiredToken' + new Date().getTime();
    accessToken.user = { id: 'username', name: "username" };
    accessToken.expires = new Date(); // expires now
    accessToken.expires.setSeconds(accessToken.expires.getSeconds() + 20); //add 20 seconds
    accessToken.clientId = 'clientName';

    model.saveAccessToken(accessToken.accessToken, accessToken.clientId, accessToken.expires, accessToken.user, function(err) {
      if (err) {
        console.log(err);
        done();
      } else {
        var app = bootstrap('model');

        app.get('/', app.oauth.authorise(), function (req, res) {
          req.should.have.property('user');
          req.user.should.have.property('id');
          req.user.id.should.equal('username');
          req.user.should.have.property('name');
          req.user.name.should.equal('username');
          res.send('nightworld');
        });

        app.use(app.oauth.errorHandler());

        request(app)
            .get('/?access_token='+accessToken.accessToken)
            .expect(200, /nightworld/, done);
      }
    });
  });

});