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
		oauth = oauth2server(oauthConfig || { model: {} });

	app.use(express.bodyParser());
	app.use(oauth.handler());
	app.use(oauth.errorHandler());

	return app;
};

describe('OAuth2Server.handler()', function() {
	it('should passthrough /oauth/token', function (done) {
		var app = bootstrap();

		request(app)
			.get('/oauth/token')
			.expect(400)
			.end(function (err, res) {
				if (err) return done(err);
				res.body.error_description.should.not.match(/the access token was not found/i);
				done();
			});
	});

	describe('when determining what\'s allowed', function () {
		it('should authorize (disallow) root by default', function (done) {
			var app = bootstrap();

			request(app)
				.get('/')
				.expect(400, done);
		});

		it('should authorize (disallow) paths by default', function (done) {
			var app = bootstrap();

			request(app)
				.get('/thom')
				.expect(400, done);
		});

		it('should allow via array', function (done) {
			var app = bootstrap({
				allow: ['/thom', '/another'],
				model: {}
			});

			app.get('/thom', function (req, res) {
				res.jsonp({});
			});

			request(app)
				.get('/thom')
				.expect(200, done);
		});


		it('should allow POST via array', function (done) {
			var app = bootstrap({
				allow: ['/thom', '/another'],
				model: {}
			});

			app.post('/thom', function (req, res) {
				res.jsonp({});
			});

			request(app)
				.post('/thom')
				.expect(200, done);
		});

		it('should allow via object', function (done) {
			var app = bootstrap({
				allow: {
					get: ['/thom', '/another']
				},
				model: {}
			});

			app.get('/thom', function (req, res) {
				res.jsonp({});
			});

			request(app)
				.get('/thom')
				.expect(200, done);
		});

		it('should only allow correct method via object', function (done) {
			var app = bootstrap({
				allow: {
					get: ['/thom', '/another']
				},
				model: {}
			});

			app.get('/thom', function (req, res) {
				res.jsonp({});
			});

			request(app)
				.post('/thom')
				.expect(400, done);
		});
	});
});