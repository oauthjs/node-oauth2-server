
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../../lib/errors/invalid-argument-error');
var Promise = require('bluebird');
var Request = require('../../lib/request');
var Response = require('../../lib/response');
var Server = require('../../lib/server');
var should = require('should');

/**
 * Test `Server`.
 */

describe('Server', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new Server({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should set the `model`', function() {
      var model = {};
      var server = new Server({ model: model });

      server.options.model.should.equal(model);
    });

    it('should set the default `accessTokenLifetime`', function() {
      var server = new Server({ model: {} });

      server.options.accessTokenLifetime.should.equal(3600);
    });

    it('should set the default `authCodeLifetime`', function() {
      var server = new Server({ model: {} });

      server.options.authCodeLifetime.should.equal(300);
    });

    it('should set the default `refreshTokenLifetime`', function() {
      var server = new Server({ model: {} });

      server.options.refreshTokenLifetime.should.equal(1209600);
    });
  });

  describe('authenticate()', function() {
    it('should return a promise', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      var handler = server.authenticate(request);

      handler.should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function(next) {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });

      server.authenticate(request, null, next);
    });
  });

  describe('authorize()', function() {
    it('should return a promise', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { redirectUri: 'http://example.com/cb' };
        },
        saveAuthCode: function() {
          return { authCode: 123 };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', response_type: 'code' }, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: { state: 'foobar' } });
      var response = new Response({ body: {}, headers: {} });
      var handler = server.authorize(request, response);

      handler.should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function(next) {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { redirectUri: 'http://example.com/cb' };
        },
        saveAuthCode: function() {
          return { authCode: 123 };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', response_type: 'code' }, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: { state: 'foobar' } });
      var response = new Response({ body: {}, headers: {} });

      server.authorize(request, response, null, next);
    });
  });

  describe('token()', function() {
    it('should return a promise', function() {
      var model = {
        getClient: function() {
          return {};
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 1234 };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', grant_type: 'password', username: 'foo', password: 'pass' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });
      var handler = server.token(request, response);

      handler.should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function(next) {
      var model = {
        getClient: function() {
          return {};
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 1234 };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', grant_type: 'password', username: 'foo', password: 'pass' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });

      server.token(request, response, null, next);
    });
  });
});
