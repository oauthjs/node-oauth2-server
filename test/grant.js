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
      grants: ['password', 'refresh_token']
    });

  app.use(express.bodyParser());

  app.all('/oauth/token', oauth.grant());

  app.use(oauth.errorHandler());

  return app;
};

var validBody = {
  grant_type: 'password',
  client_id: 'thom',
  client_secret: 'nightworld',
  username: 'thomseddon',
  password: 'nightworld'
};

describe('OAuth2Server.token()', function() {

  describe('when parsing request', function () {
    it('should only allow post', function (done) {
      var app = bootstrap();

      request(app)
        .get('/oauth/token')
        .expect(/method must be POST/i, 400, done);
    });

    it('should only allow application/x-www-form-urlencoded', function (done) {
      var app = bootstrap();

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/json')
        .send({}) // Required to be valid JSON
        .expect(/application\/x-www-form-urlencoded/i, 400, done);
    });

    it('should check grant_type exists', function (done) {
      var app = bootstrap();

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(/invalid or missing grant_type parameter/i, 400, done);
    });

    it('should ensure grant_type is allowed', function (done) {
      var app = bootstrap({ model: {}, grants: ['refresh_token'] });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password' })
        .expect(/invalid or missing grant_type parameter/i, 400, done);
    });

    it('should check client_id exists', function (done) {
      var app = bootstrap();

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password' })
        .expect(/invalid or missing client_id parameter/i, 400, done);
    });

    it('should check client_secret exists', function (done) {
      var app = bootstrap();

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password', client_id: 'thom' })
        .expect(/missing client_secret parameter/i, 400, done);
    });

    it('should extract credentials from body', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            id.should.equal('thom');
            secret.should.equal('nightworld');
            callback(false, false);
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password', client_id: 'thom', client_secret: 'nightworld' })
        .expect(400, done);
    });

    it('should extract credentials from header (Basic)', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            id.should.equal('thom');
            secret.should.equal('nightworld');
            callback(false, false);
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Authorization', 'Basic dGhvbTpuaWdodHdvcmxkCg==')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password' })
        .expect(400, done);
    });
  });

  describe('check client credentials against model', function () {
    it('should detect invalid client', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, false); // Fake invalid
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password', client_id: 'thom', client_secret: 'nightworld' })
        .expect(/client credentials are invalid/i, 400, done);
    });
  });

  describe('check grant type allowed for client (via model)', function () {
    it('should detect grant type not allowed', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, true);
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, false); // Not allowed
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'password', client_id: 'thom', client_secret: 'nightworld' })
        .expect(/grant type is unauthorised for this client_id/i, 400, done);
    });
  });

  describe('when checking grant_type =', function () {
    describe('password', function () {
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
          grants: ['password']
        });

        request(app)
          .post('/oauth/token')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            grant_type: 'password',
            client_id: 'thom',
            client_secret: 'nightworld'
          })
          .expect(/missing parameters. \\"username\\" and \\"password\\"/i, 400, done);

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
              uname.should.equal('thomseddon');
              pword.should.equal('nightworld');
              callback(false, false); // Fake invalid user
            }
          },
          grants: ['password']
        });

        request(app)
          .post('/oauth/token')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send(validBody)
          .expect(/user credentials are invalid/i, 400, done);

      });
    });

    describe('refresh_token', function () {
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
          .expect(/no \\"refresh_token\\" parameter/i, 400, done);

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
          .expect(/invalid refresh token/i, 400, done);

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
          .expect(/invalid refresh token/i, 400, done);

      });

      it('should detect expired refresh token', function (done) {
        var app = bootstrap({
          model: {
            getClient: function (id, secret, callback) {
              callback(false, { client_id: 'thom' });
            },
            grantTypeAllowed: function (clientId, grantType, callback) {
              callback(false, true);
            },
            getRefreshToken: function (data, callback) {
              callback(false, {
                client_id: 'thom',
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
          .expect(/refresh token has expired/i, 400, done);

      });

      it('should allow valid request', function (done) {
        var app = bootstrap({
          model: {
            getClient: function (id, secret, callback) {
              callback(false, { client_id: 'thom' });
            },
            grantTypeAllowed: function (clientId, grantType, callback) {
              callback(false, true);
            },
            getRefreshToken: function (refreshToken, callback) {
              refreshToken.should.equal('abc123');
              callback(false, {
                client_id: 'thom',
                expires: new Date(),
                user_id: '123'
              });
            },
            saveAccessToken: function (data, cb) {
              cb();
            },
            saveRefreshToken: function (data, cb) {
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
          .expect(/"access_token": "(.*)",\n\s+(.*)\n\s+"refresh_token": "(.*)"/i, 400, done);

      });

      it('should allow valid request with non-expiring token (token= null)', function (done) {
        var app = bootstrap({
          model: {
            getClient: function (id, secret, callback) {
              callback(false, { client_id: 'thom' });
            },
            grantTypeAllowed: function (clientId, grantType, callback) {
              callback(false, true);
            },
            getRefreshToken: function (data, callback) {
              callback(false, {
                client_id: 'thom',
                expires: null,
                user_id: '123'
              });
            },
            saveAccessToken: function (data, cb) {
              cb();
            },
            saveRefreshToken: function (data, cb) {
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
          .expect(/"access_token": "(.*)",\n\s+(.*)\n\s+"refresh_token": "(.*)"/i, 400, done);

      });
    });

    describe('custom', function () {
      it('should ignore if no extendedGrant method', function (done) {
        var app = bootstrap({
          model: {
            getClient: function (id, secret, callback) {
              callback(false, true);
            },
            grantTypeAllowed: function (clientId, grantType, callback) {
              callback(false, true);
            }
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
          .expect(/invalid grant_type/i, 400, done);
      });

      it('should still detect unsupported grant_type', function (done) {
        var app = bootstrap({
          model: {
            getClient: function (id, secret, callback) {
              callback(false, true);
            },
            grantTypeAllowed: function (clientId, grantType, callback) {
              callback(false, true);
            },
            extendedGrant: function (req, callback) {
              callback(false, false);
            }
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
          .expect(/invalid grant_type/i, 400, done);
      });

      it('should require a user.id', function (done) {
        var app = bootstrap({
          model: {
            getClient: function (id, secret, callback) {
              callback(false, true);
            },
            grantTypeAllowed: function (clientId, grantType, callback) {
              callback(false, true);
            },
            extendedGrant: function (req, callback) {
              callback(false, true, {}); // Fake empty user
            }
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
          .expect(/invalid request/i, 400, done);
      });

      it('should passthrough valid request', function (done) {
        var app = bootstrap({
          model: {
            getClient: function (id, secret, callback) {
              callback(false, true);
            },
            grantTypeAllowed: function (clientId, grantType, callback) {
              callback(false, true);
            },
            extendedGrant: function (req, callback) {
              callback(false, true, { id: 3 });
            },
            saveAccessToken: function () {
              done(); // That's enough
            }
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
    });

    it('should detect unsupported grant_type', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, true);
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          }
        },
        grants: ['password', 'implicit']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ grant_type: 'implicit', client_id: 'thom', client_secret: 'nightworld' })
        .expect(/invalid grant_type/i, 400, done);
    });
  });

  describe('generate access token', function () {
    it('should allow override via model', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, true);
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          },
          getUser: function (uname, pword, callback) {
            callback(false, { id: 1 });
          },
          generateToken: function (type, req, callback) {
            callback(false, 'thommy');
          },
          saveAccessToken: function (data, callback) {
            data.access_token.should.equal('thommy');
            callback();
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(/thommy/, 200, done);

    });

    it('should reissue if model returns object', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, true);
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          },
          getUser: function (uname, pword, callback) {
            callback(false, { id: 1 });
          },
          generateToken: function (type, req, callback) {
            callback(false, { access_token: 'thommy' });
          },
          saveAccessToken: function (data, callback) {
            callback(new Error('Should not be saving'));
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(/"access_token": "thommy"/, 200, done);

    });
  });

  describe('saving access token', function () {
    it('should pass valid params to model.saveAccessToken', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, { client_id: 'thom' });
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          },
          getUser: function (uname, pword, callback) {
            callback(false, { id: 1 });
          },
          saveAccessToken: function (data, callback) {
            data.access_token.should.be.a('string');
            data.access_token.should.have.length(40);
            data.client_id.should.equal('thom');
            data.user_id.should.equal(1);
            (+data.expires).should.be.within(10, (+new Date()) + 3600000);
            callback();
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200, done);

    });

    it('should pass valid params to model.saveRefreshToken', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, { client_id: 'thom' });
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          },
          getUser: function (uname, pword, callback) {
            callback(false, { id: 1 });
          },
          saveAccessToken: function (data, callback) {
            callback();
          },
          saveRefreshToken: function (data, callback) {
            data.refresh_token.should.be.a('string');
            data.refresh_token.should.have.length(40);
            data.client_id.should.equal('thom');
            data.user_id.should.equal(1);
            (+data.expires).should.be.within(10, (+new Date()) + 1209600000);
            callback();
          }
        },
        grants: ['password', 'refresh_token']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200, done);

    });
  });

  describe('issue access token', function () {
    it('should return an oauth compatible response', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, { client_id: 'thom' });
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          },
          getUser: function (uname, pword, callback) {
            callback(false, { id: 1 });
          },
          saveAccessToken: function (data, callback) {
            callback();
          }
        },
        grants: ['password']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          res.body.should.have.keys(['access_token', 'token_type', 'expires_in']);
          res.body.access_token.should.be.a('string');
          res.body.access_token.should.have.length(40);
          res.body.token_type.should.equal('bearer');
          res.body.expires_in.should.equal(3600);

          done();
        });

    });

    it('should return an oauth compatible response with refresh_token', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, { client_id: 'thom' });
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          },
          getUser: function (uname, pword, callback) {
            callback(false, { id: 1 });
          },
          saveAccessToken: function (data, callback) {
            callback();
          },
          saveRefreshToken: function (data, callback) {
            callback();
          }
        },
        grants: ['password', 'refresh_token']
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          res.body.should.have.keys(['access_token', 'token_type', 'expires_in',
            'refresh_token']);
          res.body.access_token.should.be.a('string');
          res.body.access_token.should.have.length(40);
          res.body.refresh_token.should.be.a('string');
          res.body.refresh_token.should.have.length(40);
          res.body.token_type.should.equal('bearer');
          res.body.expires_in.should.equal(3600);

          done();
        });

    });

    it('should exclude expires_in if accessTokenLifetime = null', function (done) {
      var app = bootstrap({
        model: {
          getClient: function (id, secret, callback) {
            callback(false, { client_id: 'thom' });
          },
          grantTypeAllowed: function (clientId, grantType, callback) {
            callback(false, true);
          },
          getUser: function (uname, pword, callback) {
            callback(false, { id: 1 });
          },
          saveAccessToken: function (data, callback) {
            should.strictEqual(null, data.expires);
            callback();
          },
          saveRefreshToken: function (data, callback) {
            should.strictEqual(null, data.expires);
            callback();
          }
        },
        grants: ['password', 'refresh_token'],
        accessTokenLifetime: null,
        refreshTokenLifetime: null
      });

      request(app)
        .post('/oauth/token')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(validBody)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          res.body.should.have.keys(['access_token', 'refresh_token', 'token_type']);
          res.body.access_token.should.be.a('string');
          res.body.access_token.should.have.length(40);
          res.body.refresh_token.should.be.a('string');
          res.body.refresh_token.should.have.length(40);
          res.body.token_type.should.equal('bearer');

          done();
        });

    });
  });

});
