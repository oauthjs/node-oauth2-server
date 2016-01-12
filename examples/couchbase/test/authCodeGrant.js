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

var bootstrap = function (alternateModel, params, continueAfterResponse) {

  var app = express();
  app.oauth = oauth2server({
    model: model,
    continueAfterResponse: continueAfterResponse
  });

  app.use(bodyParser());

  app.post('/authorise', app.oauth.authCodeGrant(function (req, next) {
    next.apply(null, params || []);
  }));

  app.get('/authorise', app.oauth.authCodeGrant(function (req, next) {
    next.apply(null, params || []);
  }));

  app.use(app.oauth.errorHandler());

  return app;
};

describe('AuthCodeGrant', function() {

  it('should detect no response type', function (done) {
    var app = bootstrap();

    request(app)
      .post('/authorise')
      .expect(400, /invalid response_type parameter/i, done);
  });

  it('should detect invalid response type', function (done) {
    var app = bootstrap();

    request(app)
      .post('/authorise')
      .send({ response_type: 'token' })
      .expect(400, /invalid response_type parameter/i, done);
  });

  it('should detect no client_id', function (done) {
    var app = bootstrap();

    request(app)
      .post('/authorise')
      .send({ response_type: 'code' })
      .expect(400, /invalid or missing client_id parameter/i, done);
  });

  it('should detect no redirect_uri', function (done) {
    var app = bootstrap();

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName'
      })
      .expect(400, /invalid or missing redirect_uri parameter/i, done);
  });

  it('should detect invalid client', function (done) {
    var app = bootstrap();

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientNam',
        redirect_uri: 'http://clientapp.com'
      })
      .expect('WWW-Authenticate', 'Basic realm="Service"')
      .expect(400, /invalid client credentials/i, done);
  });

  it('should detect mismatching redirect_uri with a string', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'clientName',
          redirectUri: 'http://clientapp.com'
        });
      }
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://wrong.com'
      })
      .expect(400, /redirect_uri does not match/i, done);
  });

  it('should detect mismatching redirect_uri within an array', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = null;
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok){
      if(err){
        console.log(err);
      } else {
        var app = bootstrap();

        request(app)
            .post('/authorise')
            .send({
              response_type: 'code',
              client_id: client.clientId,
              redirect_uri: 'http://wrong.com'
            })
            .expect(400, /redirect_uri does not match/i, done);
      }
    });
  });

  it('should accept a valid redirect_uri within an array', function (done) {
    var client = {};
    client.clientId = 'clientName' + new Date().getTime();
    client.clientSecret = null;
    client.redirectUri = ['http://clientapp.com','http://clientwebsite.com'];

    model.saveClient(client.clientId, client.clientSecret, client.redirectUri, function(err, ok) {
      if (err) {
        console.log(err);
        done();
      } else {
        var app = bootstrap();

        request(app)
            .post('/authorise')
            .send({
              response_type: 'code',
              client_id: client.clientId,
              redirect_uri: 'http://clientapp.com'
            })
            .expect(302, /Moved temporarily/i, done);
      }
    });
  });

  it('should accept a valid redirect_uri with a string', function (done) {
    var app = bootstrap();

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com'
      })
      .expect(302, /Moved temporarily/i, done);
  });

  it('should detect user access denied', function (done) {
    var app = bootstrap({}, [false, false]);

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com'
      })
      .expect(302,
        /Redirecting to http:\/\/clientapp.com\?error=access_denied/i, done);
  });

  it('should try to save auth code', function (done) {
    var app = bootstrap({}, [false, true]);

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com'
      })
      .expect(302,function(err, res){
        var code = res.header.location.replace('http://clientapp.com?code=','');
          code.should.have.lengthOf(40);
        model.getAuthCode(code, function(err, authCode){
          if(err){
            console.log(err);
          } else {
            authCode.clientId.should.equal('clientName');
            (+new Date(authCode.expires)).should.be.within(2, (+new Date()) + 30000);
            done();
          }
        });
      });
  });

  it('should accept valid request and return code using POST', function (done) {

    var app = bootstrap({}, [false, true]);

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com'
      })
      .expect(302, function (err, res) {
        var code = res.header.location.replace('http://clientapp.com?code=','');
        code.should.have.lengthOf(40);
        model.getAuthCode(code, function(err, authCode){
          if(err){
            console.log(err);
          } else {
            authCode.clientId.should.equal('clientName');
            (+new Date(authCode.expires)).should.be.within(2, (+new Date()) + 30000);
            done();
          }
        });
      });
  });

  it('should accept valid request and return code using GET', function (done) {
    var code;

    var app = bootstrap({}, [false, true]);

    request(app)
      .get('/authorise')
      .query({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com'
      })
      .expect(302, function (err, res) {
        var code = res.header.location.replace('http://clientapp.com?code=','');
        code.should.have.lengthOf(40);
        model.getAuthCode(code, function(err, authCode){
          if(err){
            console.log(err);
          } else {
            authCode.clientId.should.equal('clientName');
            (+new Date(authCode.expires)).should.be.within(2, (+new Date()) + 30000);
            done();
          }
        });
      });
  });

  it('should accept valid request and return code and state using GET', function (done) {
    var code;

    var app = bootstrap({}, [false, true]);

    request(app)
      .get('/authorise')
      .query({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com',
        state: 'some_state'
      })
      .expect(302, function (err, res) {
        var code = res.header.location.replace('http://clientapp.com?code=','').replace('&state=some_state','');
        code.should.have.lengthOf(40);
        model.getAuthCode(code, function(err, authCode){
          if(err){
            console.log(err);
          } else {
            authCode.clientId.should.equal('clientName');
            res.header.location.should.equal('http://clientapp.com?code=' + code  + '&state=some_state');
            (+new Date(authCode.expires)).should.be.within(2, (+new Date()) + 30000);
            done();
          }
        });
      });
  });

  it('should continue after success response if continueAfterResponse = true', function (done) {
    var app = bootstrap({}, [false, true], true);

    var hit = false;
    app.all('*', function (req, res, done) {
      hit = true;
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com'
      })
      .end(function (err, res) {
        if (err) return done(err);
        hit.should.equal(true);
        done();
      });
  });

  it('should continue after redirect response if continueAfterResponse = true', function (done) {
    var app = bootstrap({}, [false, false], true);

    var hit = false;
    app.all('*', function (req, res, done) {
      hit = true;
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'clientName',
        redirect_uri: 'http://clientapp.com'
      })
      .end(function (err, res) {
        if (err) return done(err);
        hit.should.equal(true);
        done();
      });
  });

});
