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

var assert = require('assert'),
	express = require('express'),
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
	app.use(oauth.handler());
	app.use(oauth.errorHandler());

	return app;
};

var validBody = {
	grant_type: 'password',
	client_id: 'thom',
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

		it('should extract credentials from body', function (done) {
			var app = bootstrap({
				model: {
					getClient: function (id, secret, callback) {
						try {
							id.should.equal('thom');
							secret.should.equal('nightworld');
							callback(false, false);
						} catch (e) {
							return done(e);
						}
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
						try {
							id.should.equal('thom');
							secret.should.equal('nightworld');
							callback(false, false);
						} catch (e) {
							return done(e);
						}
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
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, false); // Not allowed
					}
				},
				grants: ['password']
			});

			request(app)
				.post('/oauth/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send({ grant_type: 'password', client_id: 'thom' })
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
						grantTypeAllowed: function (id, secret, callback) {
							callback(false, true);
						}
					},
					grants: ['password']
				});

				request(app)
					.post('/oauth/token')
					.set('Content-Type', 'application/x-www-form-urlencoded')
					.send({ grant_type: 'password', client_id: 'thom' })
					.expect(/missing parameters. \\"username\\" and \\"password\\"/i, 400, done);

			});

			it('should detect invalid user', function (done) {
				var app = bootstrap({
					model: {
						getClient: function (id, secret, callback) {
							callback(false, true);
						},
						grantTypeAllowed: function (id, secret, callback) {
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

		describe('custom', function () {
			it('should ignore if no extendedGrant method', function (done) {
				var app = bootstrap({
					model: {
						getClient: function (id, secret, callback) {
							callback(false, true);
						},
						grantTypeAllowed: function (id, secret, callback) {
							callback(false, true);
						}
					},
					grants: ['http://custom.com']
				});

				request(app)
					.post('/oauth/token')
					.set('Content-Type', 'application/x-www-form-urlencoded')
					.send({ grant_type: 'http://custom.com', client_id: 'thom' })
					.expect(/invalid grant_type/i, 400, done);
			});

			it('should still detect unsupported grant_type', function (done) {
				var app = bootstrap({
					model: {
						getClient: function (id, secret, callback) {
							callback(false, true);
						},
						grantTypeAllowed: function (id, secret, callback) {
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
					.send({ grant_type: 'http://custom.com', client_id: 'thom' })
					.expect(/invalid grant_type/i, 400, done);
			});

			it('should require a user.id', function (done) {
				var app = bootstrap({
					model: {
						getClient: function (id, secret, callback) {
							callback(false, true);
						},
						grantTypeAllowed: function (id, secret, callback) {
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
					.send({ grant_type: 'http://custom.com', client_id: 'thom' })
					.expect(/invalid request/i, 400, done);
			});

			it('should passthrough valid request', function (done) {
				var app = bootstrap({
					model: {
						getClient: function (id, secret, callback) {
							callback(false, true);
						},
						grantTypeAllowed: function (id, secret, callback) {
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
					.send({ grant_type: 'http://custom.com', client_id: 'thom' })
					.end();
			});
		});

		it('should detect unsupported grant_type', function (done) {
			var app = bootstrap({
				model: {
					getClient: function (id, secret, callback) {
						callback(false, true);
					},
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, true);
					}
				},
				grants: ['password', 'implicit']
			});

			request(app)
				.post('/oauth/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send({ grant_type: 'implicit', client_id: 'thom' })
				.expect(/invalid grant_type/i, 400, done);
		});
	});

	describe('generate access token', function () {
		it('should allow override via model', function (done) {
			var app = bootstrap({
				model: {
					getClient: function (id, secret, callback) {
						callback(false, { client_id: id });
					},
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, true);
					},
					getUser: function (uname, pword, callback) {
						callback(false, { id: 1 });
					},
					generateToken: function (type, req, callback) {
						callback(false, 'thommy');
					},
					saveAccessToken: function (accessToken, clientId, userId, expires, callback) {
						try {
							accessToken.should.equal('thommy');
							callback();
						} catch (e) {
							return callback(e);
						}
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
						callback(false, { client_id: id });
					},
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, true);
					},
					getUser: function (uname, pword, callback) {
						callback(false, { id: 1 });
					},
					generateToken: function (type, req, callback) {
						callback(false, { access_token: 'thommy' });
					},
					saveAccessToken: function (accessToken, clientId, userId, expires, callback) {
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
						callback(false, { client_id: id });
					},
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, true);
					},
					getUser: function (uname, pword, callback) {
						callback(false, { id: 1 });
					},
					saveAccessToken: function (accessToken, clientId, userId, expires, callback) {
						try {
							accessToken.should.be.a('string');
							accessToken.should.have.length(40);
							clientId.should.equal('thom');
							userId.should.equal(1);
							(+expires).should.be.within(10, (+new Date()) + 3600000);
							callback();
						} catch (e) {
							return callback(e);
						}
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
						callback(false, { client_id: id });
					},
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, true);
					},
					getUser: function (uname, pword, callback) {
						callback(false, { id: 1 });
					},
					saveAccessToken: function (accessToken, clientId, userId, expires, callback) {
						callback();
					},
					saveRefreshToken: function (refreshToken, clientId, userId, expires, callback) {
						try {
							refreshToken.should.be.a('string');
							refreshToken.should.have.length(40);
							clientId.should.equal('thom');
							userId.should.equal(1);
							(+expires).should.be.within(10, (+new Date()) + 1209600000);
							callback();
						} catch (e) {
							return callback(e);
						}
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
						callback(false, { client_id: id });
					},
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, true);
					},
					getUser: function (uname, pword, callback) {
						callback(false, { id: 1 });
					},
					saveAccessToken: function (accessToken, clientId, userId, expires, callback) {
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
						callback(false, { client_id: id });
					},
					grantTypeAllowed: function (id, secret, callback) {
						callback(false, true);
					},
					getUser: function (uname, pword, callback) {
						callback(false, { id: 1 });
					},
					saveAccessToken: function (accessToken, clientId, userId, expires, callback) {
						callback();
					},
					saveRefreshToken: function (refreshToken, clientId, userId, expires, callback) {
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
	});

});
