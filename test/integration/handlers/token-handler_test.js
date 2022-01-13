'use strict';

/**
 * Module dependencies.
 */

const AccessDeniedError = require('../../../lib/errors/access-denied-error');
const BearerTokenType = require('../../../lib/token-types/bearer-token-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidClientError = require('../../../lib/errors/invalid-client-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
const Promise = require('bluebird');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');
const ServerError = require('../../../lib/errors/server-error');
const TokenHandler = require('../../../lib/handlers/token-handler');
const UnauthorizedClientError = require('../../../lib/errors/unauthorized-client-error');
const UnsupportedGrantTypeError = require('../../../lib/errors/unsupported-grant-type-error');
const should = require('chai').should();
const util = require('util');

/**
 * Test `TokenHandler` integration.
 */

describe('TokenHandler integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.accessTokenLifetime` is missing', function() {
      try {
        new TokenHandler();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', function() {
      try {
        new TokenHandler({ accessTokenLifetime: 120 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if `options.refreshTokenLifetime` is missing', function() {
      try {
        new TokenHandler({ accessTokenLifetime: 120, model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `refreshTokenLifetime`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', function() {
      try {
        new TokenHandler({ accessTokenLifetime: 120, model: {}, refreshTokenLifetime: 120 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getClient()`');
      }
    });

    it('should set the `accessTokenLifetime`', function() {
      const accessTokenLifetime = {};
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: accessTokenLifetime, model: model, refreshTokenLifetime: 120 });

      handler.accessTokenLifetime.should.equal(accessTokenLifetime);
    });

    it('should set the `alwaysIssueNewRefreshToken`', function() {
      const alwaysIssueNewRefreshToken = true;
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 120, alwaysIssueNewRefreshToken: alwaysIssueNewRefreshToken });

      handler.alwaysIssueNewRefreshToken.should.equal(alwaysIssueNewRefreshToken);
    });

    it('should set the `alwaysIssueNewRefreshToken` to false', function() {
      const alwaysIssueNewRefreshToken = false;
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 120, alwaysIssueNewRefreshToken: alwaysIssueNewRefreshToken });

      handler.alwaysIssueNewRefreshToken.should.equal(alwaysIssueNewRefreshToken);
    });

    it('should return the default `alwaysIssueNewRefreshToken` value', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 120 });

      handler.alwaysIssueNewRefreshToken.should.equal(true);
    });

    it('should set the `extendedGrantTypes`', function() {
      const extendedGrantTypes = { foo: 'bar' };
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, extendedGrantTypes: extendedGrantTypes, model: model, refreshTokenLifetime: 120 });
      handler.grantTypes.should.deep.include(extendedGrantTypes);
    });

    it('should set the `model`', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.model.should.equal(model);
    });

    it('should set the `refreshTokenLifetime`', function() {
      const refreshTokenLifetime = {};
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: refreshTokenLifetime });

      handler.refreshTokenLifetime.should.equal(refreshTokenLifetime);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      try {
        handler.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `request` must be an instance of Request');
      }
    });

    it('should throw an error if `response` is missing', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        handler.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `response` must be an instance of Response');
      }
    });

    it('should throw an error if the method is not `POST`', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: {}, headers: {}, method: 'GET', query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: method must be POST');
        });
    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: {}, headers: {}, method: 'POST', query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: content must be application/x-www-form-urlencoded');
        });
    });

    it('should throw the error if an oauth error is thrown', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: {}, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: cannot retrieve client credentials');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', function() {
      const model = {
        getClient: function() {
          throw new Error('Unhandled exception');
        },
        getUser: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
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
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
          e.inner.should.be.an.instanceOf(Error);
        });
    });

    it('should update the response if an error is thrown', function() {
      const model = {
        getClient: function() {
          throw new Error('Unhandled exception');
        },
        getUser: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
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
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function() {
          response.body.should.eql({ error: 'server_error', error_description: 'Unhandled exception' });
          response.status.should.equal(503);
        });
    });

    it('should return a bearer token if successful', function() {
      const token = { accessToken: 'foo', client: {}, refreshToken: 'bar', scope: 'foobar', user: {} };
      const model = {
        getClient: function() { return { grants: ['password'] }; },
        getUser: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'baz'; }
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function(data) {
          data.should.eql(token);
        })
        .catch(should.fail);
    });

    it('should not return custom attributes in a bearer token if the allowExtendedTokenAttributes is not set', function() {
      const token = { accessToken: 'foo', client: {}, refreshToken: 'bar', scope: 'foobar', user: {}, foo: 'bar' };
      const model = {
        getClient: function() { return { grants: ['password'] }; },
        getUser: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'baz'; }
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function() {
          should.exist(response.body.access_token);
          should.exist(response.body.refresh_token);
          should.exist(response.body.token_type);
          should.exist(response.body.scope);
          should.not.exist(response.body.foo);
        })
        .catch(should.fail);
    });

    it('should return custom attributes in a bearer token if the allowExtendedTokenAttributes is set', function() {
      const token = { accessToken: 'foo', client: {}, refreshToken: 'bar', scope: 'foobar', user: {}, foo: 'bar' };
      const model = {
        getClient: function() { return { grants: ['password'] }; },
        getUser: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'baz'; }
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120, allowExtendedTokenAttributes: true });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function() {
          should.exist(response.body.access_token);
          should.exist(response.body.refresh_token);
          should.exist(response.body.token_type);
          should.exist(response.body.scope);
          should.exist(response.body.foo);
        })
        .catch(should.fail);
    });
  });


  describe('getClient()', function() {
    it('should throw an error if `clientId` is invalid', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 'øå€£‰', client_secret: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_id`');
      }
    });

    it('should throw an error if `clientSecret` is invalid', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 'foo', client_secret: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClient(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_secret`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should throw an error if `client.grants` is missing', function() {
      const model = {
        getClient: function() { return {}; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: missing client `grants`');
        });
    });

    it('should throw an error if `client.grants` is invalid', function() {
      const model = {
        getClient: function() { return { grants: 'foobar' }; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `grants` must be an array');
        });
    });

    it('should throw a 401 error if the client is invalid and the request contains an authorization header', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({
        body: {},
        headers: { 'authorization': util.format('Basic %s', Buffer.from('foo:bar').toString('base64')) },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

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
      const client = { id: 12345, grants: [] };
      const model = {
        getClient: function() { return client; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(function(data) {
          data.should.equal(client);
        })
        .catch(should.fail);
    });

    describe('with `password` grant type and `requireClientAuthentication` is false', function() {

      it('should return a client ', function() {
        const client = { id: 12345, grants: [] };
        const model = {
          getClient: function() { return client; },
          saveToken: function() {}
        };

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false
          }
        });
        const request = new Request({ body: { client_id: 'blah', grant_type: 'password'}, headers: {}, method: {}, query: {} });

        return handler.getClient(request)
          .then(function(data) {
            data.should.equal(client);
          })
          .catch(should.fail);
      });
    });

    describe('with `password` grant type and `requireClientAuthentication` is false and Authorization header', function() {

      it('should return a client ', function() {
        const client = { id: 12345, grants: [] };
        const model = {
          getClient: function() { return client; },
          saveToken: function() {}
        };

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false
          }
        });
        const request = new Request({
          body: { grant_type: 'password'},
          headers: { 'authorization': util.format('Basic %s', Buffer.from('blah:').toString('base64')) },
          method: {},
          query: {}
        });

        return handler.getClient(request)
          .then(function(data) {
            data.should.equal(client);
          })
          .catch(should.fail);
      });
    });

    it('should support promises', function() {
      const model = {
        getClient: function() { return Promise.resolve({ grants: [] }); },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        getClient: function() { return { grants: [] }; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const model = {
        getClient: function(clientId, clientSecret, callback) { callback(null, { grants: [] }); },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('getClientCredentials()', function() {
    it('should throw an error if `client_id` is missing', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_secret: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClientCredentials(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: cannot retrieve client credentials');
      }
    });

    it('should throw an error if `client_secret` is missing', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        handler.getClientCredentials(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal('Invalid client: cannot retrieve client credentials');
      }
    });

    describe('with `client_id` and grant type is `password` and `requireClientAuthentication` is false', function() {
      it('should return a client', function() {
        const model = {
          getClient: function() {},
          saveToken: function() {}
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120, requireClientAuthentication: { password: false} });
        const request = new Request({ body: { client_id: 'foo', grant_type: 'password' }, headers: {}, method: {}, query: {} });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo' });
      });
    });

    describe('with `client_id` and `client_secret` in the request header as basic auth', function() {
      it('should return a client', function() {
        const model = {
          getClient: function() {},
          saveToken: function() {}
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        const request = new Request({
          body: {},
          headers: {
            'authorization': util.format('Basic %s', Buffer.from('foo:bar').toString('base64'))
          },
          method: {},
          query: {}
        });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });

    describe('with `client_id` and `client_secret` in the request body', function() {
      it('should return a client', function() {
        const model = {
          getClient: function() {},
          saveToken: function() {}
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        const request = new Request({ body: { client_id: 'foo', client_secret: 'bar' }, headers: {}, method: {}, query: {} });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });
  });

  describe('handleGrantType()', function() {
    it('should throw an error if `grant_type` is missing', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        handler.handleGrantType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `grant_type`');
      }
    });

    it('should throw an error if `grant_type` is invalid', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { grant_type: '~foo~' }, headers: {}, method: {}, query: {} });

      try {
        handler.handleGrantType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `grant_type`');
      }
    });

    it('should throw an error if `grant_type` is unsupported', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { grant_type: 'foobar' }, headers: {}, method: {}, query: {} });

      try {
        handler.handleGrantType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnsupportedGrantTypeError);
        e.message.should.equal('Unsupported grant type: `grant_type` is invalid');
      }
    });

    it('should throw an error if `grant_type` is unauthorized', function() {
      const client = { grants: ['client_credentials'] };
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { grant_type: 'password' }, headers: {}, method: {}, query: {} });

      try {
        handler.handleGrantType(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnauthorizedClientError);
        e.message.should.equal('Unauthorized client: `grant_type` is invalid');
      }
    });

    it('should throw an invalid grant error if a non-oauth error is thrown', function() {
      const client = { grants: ['password'] };
      const model = {
        getClient: function(clientId, password, callback) { callback(null, client); },
        getUser: function(uid, pwd, callback) { callback(); },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { grant_type: 'password', username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return handler.handleGrantType(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    describe('with grant_type `authorization_code`', function() {
      it('should return a token', function() {
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode: function() { return { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }; },
          getClient: function() {},
          saveToken: function() { return token; },
          validateScope: function() { return 'foo'; },
          revokeAuthorizationCode: function() { return { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() / 2), user: {} }; }
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request, client)
          .then(function(data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with grant_type `client_credentials`', function() {
      it('should return a token', function() {
        const client = { grants: ['client_credentials'] };
        const token = {};
        const model = {
          getClient: function() {},
          getUserFromClient: function() { return {}; },
          saveToken: function() { return token; },
          validateScope: function() { return 'foo'; }
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        const request = new Request({
          body: {
            grant_type: 'client_credentials',
            scope: 'foo'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request, client)
          .then(function(data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with grant_type `password`', function() {
      it('should return a token', function() {
        const client = { grants: ['password'] };
        const token = {};
        const model = {
          getClient: function() {},
          getUser: function() { return {}; },
          saveToken: function() { return token; },
          validateScope: function() { return 'baz'; }
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        const request = new Request({
          body: {
            client_id: 12345,
            client_secret: 'secret',
            grant_type: 'password',
            password: 'bar',
            username: 'foo',
            scope: 'baz'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request, client)
          .then(function(data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with grant_type `refresh_token`', function() {
      it('should return a token', function() {
        const client = { grants: ['refresh_token'] };
        const token = { accessToken: 'foo', client: {}, user: {} };
        const model = {
          getClient: function() {},
          getRefreshToken: function() { return { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() * 2), user: {} }; },
          saveToken: function() { return token; },
          revokeToken: function() { return { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; }
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        const request = new Request({
          body: {
            grant_type: 'refresh_token',
            refresh_token: 12345
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request, client)
          .then(function(data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });

    describe('with custom grant_type', function() {
      it('should return a token', function() {
        const client = { grants: ['urn:ietf:params:oauth:grant-type:saml2-bearer'] };
        const token = {};
        const model = {
          getClient: function() {},
          getUser: function() { return {}; },
          saveToken: function() { return token; },
          validateScope: function() { return 'foo'; }
        };
        const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120, extendedGrantTypes: { 'urn:ietf:params:oauth:grant-type:saml2-bearer': PasswordGrantType } });
        const request = new Request({ body: { grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer', username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

        return handler.handleGrantType(request, client)
          .then(function(data) {
            data.should.equal(token);
          })
          .catch(should.fail);
      });
    });
  });

  describe('getAccessTokenLifetime()', function() {
    it('should return the client access token lifetime', function() {
      const client = { accessTokenLifetime: 60 };
      const model = {
        getClient: function() { return client; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.getAccessTokenLifetime(client).should.equal(60);
    });

    it('should return the default access token lifetime', function() {
      const client = {};
      const model = {
        getClient: function() { return client; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.getAccessTokenLifetime(client).should.equal(120);
    });
  });

  describe('getRefreshTokenLifetime()', function() {
    it('should return the client access token lifetime', function() {
      const client = { refreshTokenLifetime: 60 };
      const model = {
        getClient: function() { return client; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.getRefreshTokenLifetime(client).should.equal(60);
    });

    it('should return the default access token lifetime', function() {
      const client = {};
      const model = {
        getClient: function() { return client; },
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.getRefreshTokenLifetime(client).should.equal(120);
    });
  });

  describe('getTokenType()', function() {
    it('should return a token type', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const tokenType = handler.getTokenType({ accessToken: 'foo', refreshToken: 'bar', scope: 'foobar' });
      tokenType.should.deep.include({ accessToken: 'foo', accessTokenLifetime: undefined, refreshToken: 'bar', scope: 'foobar' });
    });
  });

  describe('updateSuccessResponse()', function() {
    it('should set the `body`', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.body.should.eql({ access_token: 'foo', expires_in: 'bar', refresh_token: 'biz', token_type: 'Bearer' });
    });

    it('should set the `Cache-Control` header', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.get('Cache-Control').should.equal('no-store');
    });

    it('should set the `Pragma` header', function() {
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.get('Pragma').should.equal('no-cache');
    });
  });

  describe('updateErrorResponse()', function() {
    it('should set the `body`', function() {
      const error = new AccessDeniedError('Cannot request a token');
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.body.error.should.equal('access_denied');
      response.body.error_description.should.equal('Cannot request a token');
    });

    it('should set the `status`', function() {
      const error = new AccessDeniedError('Cannot request a token');
      const model = {
        getClient: function() {},
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.status.should.equal(400);
    });
  });
});
