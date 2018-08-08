'use strict';

/**
 * Module dependencies.
 */

var AccessDeniedError = require('../../../lib/errors/access-denied-error');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidClientError = require('../../../lib/errors/invalid-client-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var InvalidTokenError = require('../../../lib/errors/invalid-token-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var Response = require('../../../lib/response');
var ServerError = require('../../../lib/errors/server-error');
var RevokeHandler = require('../../../lib/handlers/revoke-handler');
var should = require('should');
var util = require('util');

/**
 * Test `RevokeHandler` integration.
 */

describe('RevokeHandler integration', function() {
  describe('constructor()', function() {

    it('should throw an error if `options.model` is missing', function() {
      try {
        new RevokeHandler({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', function() {
      try {
        new RevokeHandler({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getClient()`');
      }
    });

    it('should set the `model`', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      handler.model.should.equal(model);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      try {
        handler.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `request` must be an instance of Request');
      }
    });

    it('should throw an error if `response` is missing', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        handler.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `response` must be an instance of Response');
      }
    });

    it('should throw an error if the method is not `POST`', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: {}, headers: {}, method: 'GET', query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: method must be POST');
        });
    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: {}, headers: {}, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: content must be application/x-www-form-urlencoded');
        });
    });

    it('should throw the error if an oauth error is thrown', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { token: 'hash' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: cannot retrieve client credentials');
        });
    });

    it('should throw the error if an oauth error is thrown', function() {
      var model = {
        getClient: function() { return { grants: ['password'] }; },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `token`');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', function() {
      var model = {
        getClient: function() {
          throw new Error('Unhandled exception');
        },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          token: 'hash'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
          e.inner.should.be.an.instanceOf(Error);
        });
      });

    it('should update the response if an error is thrown', function() {
      var model = {
        getClient: function() {
          throw new Error('Unhandled exception');
        },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          grant_type: 'password',
          password: 'bar',
          username: 'foo'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function() {
          response.body.should.eql({ error: 'server_error', error_description: 'Unhandled exception' });
          response.status.should.equal(500);
        });
    });

    it('should not update the response if an invalid token error is thrown', function() {
      var token = { refreshToken: 'hash', client: {}, user: {}, refreshTokenExpiresAt: new Date('2015-01-01') };
      var client = { grants: ['password'] };
      var model = {
        getClient: function() { return client; },
        revokeToken: function() { return token; },
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          token: 'hash'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          response.body.should.eql({});
          response.status.should.equal(200);
        });
    });

    it('should return an empty object if successful', function() {
      var token = { refreshToken: 'hash', client: {}, user: {}, refreshTokenExpiresAt: new Date(new Date() * 2) };
      var client = { grants: ['password'] };
      var model = {
        getClient: function() { return client; },
        revokeToken: function() { return token; },
        getRefreshToken: function() { return token; },
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          token: 'hash'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function(data) {
          should.exist(data);
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', function() {
    it('should throw an error if `clientId` is invalid', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 'øå€£‰', client_secret: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_id`');
      }
    });

    it('should throw an error if `clientId` is invalid', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 'foo', client_secret: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_secret`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should throw an error if `client.grants` is missing', function() {
      var model = {
        getClient: function() { return {}; },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: missing client `grants`');
        });
    });

    it('should throw a 401 error if the client is invalid and the request contains an authorization header', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({
        body: {},
        headers: { 'authorization': util.format('Basic %s', new Buffer('foo:bar').toString('base64')) },
        method: {},
        query: {}
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.getClient(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.code.should.equal(401);
          e.message.should.equal('Invalid client: client is invalid');

          response.get('WWW-Authenticate').should.equal('Basic realm="Service"');
        });
    });

    it('should return a client', function() {
      var client = { id: 12345, grants: [] };
      var model = {
        getClient: function() { return client; },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(function(data) {
          data.should.equal(client);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var model = {
        getClient: function() { return Promise.resolve({ grants: [] }); },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var model = {
        getClient: function(clientId, clientSecret, callback) {
          callback(null, { grants: [] });
        },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        getClient: function() { return { grants: [] }; },
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('getClientCredentials()', function() {
    it('should throw an error if `client_id` is missing', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_secret: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClientCredentials(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: cannot retrieve client credentials');
      }
    });

    it('should throw an error if `client_secret` is missing', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClientCredentials(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: cannot retrieve client credentials');
      }
    });

    describe('with `client_id` and `client_secret` in the request header as basic auth', function() {
      it('should return a client', function() {
        var model = {
          getClient: function() {},
          revokeToken: function() {},
          getRefreshToken: function() {},
          getAccessToken: function() {}
        };
        var handler = new RevokeHandler({ model: model });
        var request = new Request({
          body: {},
          headers: {
            'authorization': util.format('Basic %s', new Buffer('foo:bar').toString('base64'))
          },
          method: {},
          query: {}
        });
        var credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });

    describe('with `client_id` and `client_secret` in the request body', function() {
      it('should return a client', function() {
        var model = {
          getClient: function() {},
          revokeToken: function() {},
          getRefreshToken: function() {},
          getAccessToken: function() {}
        };
        var handler = new RevokeHandler({ model: model });
        var request = new Request({ body: { client_id: 'foo', client_secret: 'bar' }, headers: {}, method: {}, query: {} });
        var credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });
  });

  describe('handleRevokeToken()', function() {
    it('should throw an error if `token` is missing', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return handler.handleRevokeToken(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `token`');
        });
    });

    it('should return a token', function() {
      var client = { id: 12345, grants: ['password'] };
      var token = { accessToken: 'hash', client: { id: 12345 }, accessTokenExpiresAt: new Date(new Date() * 2), user: {} };
      var model = {
        getClient: function() {},
        revokeToken: function() { return token; },
        getRefreshToken: function() {},
        getAccessToken: function() { return token; }
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { token: 'hash' }, headers: {}, method: {}, query: {} });

      return handler.handleRevokeToken(request, client)
        .then(function(data) {
          should.exist(data);
        })
        .catch(should.fail);
    });

    it('should return a token', function() {
      var client = { id: 12345, grants: ['password'] };
      var token = { refreshToken: 'hash', client: { id: 12345 }, refreshTokenExpiresAt: new Date(new Date() * 2), user: {} };
      var model = {
        getClient: function() {},
        revokeToken: function() { return token; },
        getRefreshToken: function() { return token; },
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { token: 'hash' }, headers: {}, method: {}, query: {} });

      return handler.handleRevokeToken(request, client)
        .then(function(data) {
          should.exist(data);
        })
        .catch(should.fail);
    });
  });

  describe('getRefreshToken()', function() {
    it('should throw an error if the `refreshToken` is invalid', function() {
      var client = {};
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getRefreshToken('hash', client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: refresh token is invalid');
        });
    });

    it('should throw an error if the `client_id` does not match', function() {
      var client = { id: 'foo' };
      var token = { refreshToken: 'hash', client: { id: 'baz'}, user: {}, refreshTokenExpiresAt: new Date(new Date() * 2) };
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() { return token; },
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getRefreshToken('hash', client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should return a token', function() {
      var client = { id: 'foo' };
      var token = { refreshToken: 'hash', client: { id: 'foo'}, user: {}, refreshTokenExpiresAt: new Date(new Date() * 2) };
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() { return token; },
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getRefreshToken('hash', client)
        .then(function(token) {
          should.exist(token);
        })
        .catch(should.fail);
    });

    it('should support callbacks', function() {
      var client = { id: 'foo' };
      var token = { refreshToken: 'hash', client: { id: 'foo'}, user: {}, refreshTokenExpiresAt: new Date(new Date() * 2) };
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function(refreshToken, callback) {
          callback(null, token);
        },
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getRefreshToken('hash', client)
        .then(function(token) {
          should.exist(token);
        })
        .catch(should.fail);
    });
  });

  describe('getAccessToken()', function() {
    it('should throw an error if the `accessToken` is invalid', function() {
      var client = {};
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getAccessToken: function() {},
        getRefreshToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getAccessToken('hash', client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: access token is invalid');
        });
    });

    it('should throw an error if the `client_id` does not match', function() {
      var client = { id: 'foo' };
      var token = { accessToken: 'hash', client: { id: 'baz'}, user: {}, accessTokenExpiresAt: new Date(new Date() * 2) };
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getAccessToken: function() { return token; },
        getRefreshToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getAccessToken('hash', client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should return a token', function() {
      var client = { id: 'foo' };
      var token = { accessToken: 'hash', client: { id: 'foo'}, user: {}, accessTokenExpiresAt: new Date(new Date() * 2) };
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getAccessToken: function() { return token; },
        getRefreshToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getAccessToken('hash', client)
        .then(function(token) {
          should.exist(token);
        })
        .catch(should.fail);
    });

    it('should support callbacks', function() {
      var client = { id: 'foo' };
      var token = { accessToken: 'hash', client: { id: 'foo'}, user: {}, accessTokenExpiresAt: new Date(new Date() * 2) };
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getAccessToken: function(accessToken, callback) {
          callback(null, token);
        },
        getRefreshToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.getAccessToken('hash', client)
        .then(function(token) {
          should.exist(token);
        })
        .catch(should.fail);
    });
  });

  describe('revokeToken()', function() {
    it('should throw an error if the `refreshToken` is invalid', function() {
      var token = 'hash';
      var client = {};
      var model = {
        getClient: function() {},
        revokeToken: function() { return false; },
        getRefreshToken: function() { return { client: {}, user: {}};},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.revokeToken(token, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: token is invalid');
        });
    });

    it('should support callbacks', function() {
      var token = {};
      var client = {};
      var model = {
        getClient: function() {},
        revokeToken: function(tokenObject, callback) {
          callback(null, null);
        },
        getRefreshToken: function(refreshToken, callback) {
          callback(null, { client: {}, user: {}});
        },
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });

      return handler.revokeToken(token, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: token is invalid');
        });
    });
  });

  describe('getTokenFromRequest()', function() {
    it('should throw an error if `accessToken` is missing', function() {

      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        handler.getTokenFromRequest(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `token`');
      }
    });
  });

  describe('updateErrorResponse()', function() {
    it('should set the `body`', function() {
      var error = new AccessDeniedError('Cannot request a revoke');
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.body.error.should.equal('access_denied');
      response.body.error_description.should.equal('Cannot request a revoke');
    });

    it('should set the `status`', function() {
      var error = new AccessDeniedError('Cannot request a revoke');
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.status.should.equal(400);
    });
  });
});
