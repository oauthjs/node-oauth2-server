var assert = require('assert'),
	express = require('express'),
	request = require('supertest'),
	should = require('should');

var oauth2server = require('../');

var bootstrap = function (oauthConfig) {
	var app = express(),
		oauth = new oauth2server(oauthConfig || { model: {} });

	app.use(express.bodyParser());
	app.all('/*', oauth.handle());

	return app;
};

describe('OAuth2Server.handle()', function() {
	describe('error handler', function () {
		it('should return an oauth conformat response', function (done) {
			var app = bootstrap();

			request(app)
				.get('/')
				.expect(400)
				.end(function (err, res) {
					if (err) return done(err);

					res.body.should.have.keys('code', 'error', 'error_description');

					res.body.code.should.be.a('number');
					res.body.code.should.equal(res.statusCode);

					res.body.error.should.be.a('string');

					res.body.error_description.should.be.a('string');

					done();
				});
		});
	});

	it('should passthrough /oauth/token', function (done) {
		var app = bootstrap();

		request(app)
			.get('/oauth/token')
			.expect(400)
			.end(function (err, res) {
				if (err) return done(err);
				res.body.error_description.should.not.match(/the access token was not found/i)
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
	});
});