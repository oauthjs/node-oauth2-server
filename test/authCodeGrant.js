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

var bootstrap = function (model, params, continueAfterResponse) {

  var app = express();
  app.oauth = oauth2server({
    model: model || {},
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
        client_id: 'thom'
      })
      .expect(400, /invalid or missing redirect_uri parameter/i, done);
  });

  it('should detect invalid client', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(); // Fake invalid
      }
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .expect('WWW-Authenticate', 'Basic realm="Service"')
      .expect(400, /invalid client credentials/i, done);
  });

  it('should detect mismatching redirect_uri with a string', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      }
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://wrong.com'
      })
      .expect(400, /redirect_uri does not match/i, done);
  });

  it('should detect mismatching redirect_uri within an array', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: ['http://nightworld.com','http://dayworld.com']
        });
      }
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://wrong.com'
      })
      .expect(400, /redirect_uri does not match/i, done);
  });

  it('should accept a valid redirect_uri within an array', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: ['http://nightworld.com','http://dayworld.com']
        });
      }
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .expect(302, /Moved temporarily/i, done);
  });

  it('should accept a valid redirect_uri with a string', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      }
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .expect(302, /Moved temporarily/i, done);
  });

  it('should detect user access denied', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      }
    }, [false, false]);

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .expect(302,
        /Redirecting to http:\/\/nightworld.com\?error=access_denied/i, done);
  });

  it('should try to save auth code', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      },
      saveAuthCode: function (authCode, clientId, expires, user, callback) {
        should.exist(authCode);
        authCode.should.have.lengthOf(40);
        clientId.should.equal('thom');
        (+expires).should.be.within(2, (+new Date()) + 30000);
        done();
      }
    }, [false, true]);

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .end();
  });

  it('should accept valid request and return code using POST', function (done) {
    var code;

    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      },
      saveAuthCode: function (authCode, clientId, expires, user, callback) {
        should.exist(authCode);
        code = authCode;
        callback();
      }
    }, [false, true]);

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .expect(302, function (err, res) {
        res.header.location.should.equal('http://nightworld.com?code=' + code);
        done();
      });
  });

  it('should accept valid request and return code using GET', function (done) {
    var code;

    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      },
      saveAuthCode: function (authCode, clientId, expires, user, callback) {
        should.exist(authCode);
        code = authCode;
        callback();
      }
    }, [false, true]);

    request(app)
      .get('/authorise')
      .query({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .expect(302, function (err, res) {
        res.header.location.should.equal('http://nightworld.com?code=' + code);
        done();
      });
  });

  it('should continue after success response if continueAfterResponse = true', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      },
      saveAuthCode: function (authCode, clientId, expires, user, callback) {
        callback();
      }
    }, [false, true], true);

    var hit = false;
    app.all('*', function (req, res, done) {
      hit = true;
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .end(function (err, res) {
        if (err) return done(err);
        hit.should.equal(true);
        done();
      });
  });

  it('should continue after redirect response if continueAfterResponse = true', function (done) {
    var app = bootstrap({
      getClient: function (clientId, clientSecret, callback) {
        callback(false, {
          clientId: 'thom',
          redirectUri: 'http://nightworld.com'
        });
      }
    }, [false, false], true);

    var hit = false;
    app.all('*', function (req, res, done) {
      hit = true;
    });

    request(app)
      .post('/authorise')
      .send({
        response_type: 'code',
        client_id: 'thom',
        redirect_uri: 'http://nightworld.com'
      })
      .end(function (err, res) {
        if (err) return done(err);
        hit.should.equal(true);
        done();
      });
  });

});
