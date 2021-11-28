'use strict';

/**
 * Module dependencies.
 */

const AccessDeniedError = require('../../../lib/errors/access-denied-error');
const AuthenticateHandler = require('../../../lib/handlers/authenticate-handler');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const InsufficientScopeError = require('../../../lib/errors/insufficient-scope-error');
const InvalidTokenError = require('../../../lib/errors/invalid-token-error');
const Promise = require('bluebird');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');
const ServerError = require('../../../lib/errors/server-error');
const UnauthorizedRequestError = require('../../../lib/errors/unauthorized-request-error');
const should = require('chai').should();

/**
 * Test `AuthenticateHandler` integration.
 */

describe('AuthenticateHandler integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.model` is missing', function() {
      try {
        new AuthenticateHandler();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getAccessToken()`', function() {
      try {
        new AuthenticateHandler({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getAccessToken()`');
      }
    });

    it('should throw an error if `scope` was given and `addAcceptedScopesHeader()` is missing', function() {
      try {
        new AuthenticateHandler({ model: { getAccessToken: function() {} }, scope: 'foobar' });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `addAcceptedScopesHeader`');
      }
    });

    it('should throw an error if `scope` was given and `addAuthorizedScopesHeader()` is missing', function() {
      try {
        new AuthenticateHandler({ addAcceptedScopesHeader: true, model: { getAccessToken: function() {} }, scope: 'foobar' });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `addAuthorizedScopesHeader`');
      }
    });

    it('should throw an error if `scope` was given and the model does not implement `verifyScope()`', function() {
      try {
        new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: { getAccessToken: function() {} }, scope: 'foobar' });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `verifyScope()`');
      }
    });

    it('should set the `model`', function() {
      const model = { getAccessToken: function() {} };
      const grantType = new AuthenticateHandler({ model: model });

      grantType.model.should.equal(model);
    });

    it('should set the `scope`', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const grantType = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foobar'
      });

      grantType.scope.should.equal('foobar');
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      try {
        handler.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `request` must be an instance of Request');
      }
    });

    it('should set the `WWW-Authenticate` header if an unauthorized request error is thrown', function() {
      const model = {
        getAccessToken: function() {
          throw new UnauthorizedRequestError();
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function() {
          response.get('WWW-Authenticate').should.equal('Bearer realm="Service"');
        });
    });

    it('should throw the error if an oauth error is thrown', function() {
      const model = {
        getAccessToken: function() {
          throw new AccessDeniedError('Cannot request this access token');
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(AccessDeniedError);
          e.message.should.equal('Cannot request this access token');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', function() {
      const model = {
        getAccessToken: function() {
          throw new Error('Unhandled exception');
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
        });
    });

    it('should return an access token', function() {
      const accessToken = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      const model = {
        getAccessToken: function() {
          return accessToken;
        },
        verifyScope: function() {
          return true;
        }
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });
      const request = new Request({
        body: {},
        headers: { 'Authorization': 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function(data) {
          data.should.equal(accessToken);
        })
        .catch(should.fail);
    });
  });

  describe('getTokenFromRequest()', function() {
    it('should throw an error if more than one authentication method is used', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      const request = new Request({
        body: {},
        headers: { 'Authorization': 'Bearer foo' },
        method: {},
        query: { access_token: 'foo' }
      });

      try {
        handler.getTokenFromRequest(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: only one authentication method is allowed');
      }
    });

    it('should throw an error if `accessToken` is missing', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        handler.getTokenFromRequest(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(UnauthorizedRequestError);
        e.message.should.equal('Unauthorized request: no authentication given');
      }
    });
  });

  describe('getTokenFromRequestHeader()', function() {
    it('should throw an error if the token is malformed', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      const request = new Request({
        body: {},
        headers: {
          'Authorization': 'foobar'
        },
        method: {},
        query: {}
      });

      try {
        handler.getTokenFromRequestHeader(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: malformed authorization header');
      }
    });

    it('should return the bearer token', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      const request = new Request({
        body: {},
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {}
      });

      const bearerToken = handler.getTokenFromRequestHeader(request);

      bearerToken.should.equal('foo');
    });
  });

  describe('getTokenFromRequestQuery()', function() {
    it('should throw an error if the query contains a token', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      try {
        handler.getTokenFromRequestQuery();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: do not send bearer tokens in query URLs');
      }
    });

    it('should return the bearer token if `allowBearerTokensInQueryString` is true', function() {
      const handler = new AuthenticateHandler({ allowBearerTokensInQueryString: true, model: { getAccessToken: function() {} } });

      handler.getTokenFromRequestQuery({ query: { access_token: 'foo' } }).should.equal('foo');
    });
  });

  describe('getTokenFromRequestBody()', function() {
    it('should throw an error if the method is `GET`', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: 'GET',
        query: {}
      });

      try {
        handler.getTokenFromRequestBody(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: token may not be passed in the body when using the GET verb');
      }
    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        handler.getTokenFromRequestBody(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: content must be application/x-www-form-urlencoded');
      }
    });

    it('should return the bearer token', function() {
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: {},
        query: {}
      });

      handler.getTokenFromRequestBody(request).should.equal('foo');
    });
  });

  describe('getAccessToken()', function() {
    it('should throw an error if `accessToken` is missing', function() {
      const model = {
        getAccessToken: function() {}
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: access token is invalid');
        });
    });

    it('should throw an error if `accessToken.user` is missing', function() {
      const model = {
        getAccessToken: function() {
          return {};
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAccessToken()` did not return a `user` object');
        });
    });

    it('should return an access token', function() {
      const accessToken = { user: {} };
      const model = {
        getAccessToken: function() {
          return accessToken;
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(function(data) {
          data.should.equal(accessToken);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const model = {
        getAccessToken: function() {
          return Promise.resolve({ user: {} });
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        getAccessToken: function() {
          return { user: {} };
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const model = {
        getAccessToken: function(token, callback) {
          callback(null, { user: {} });
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });
  });

  describe('validateAccessToken()', function() {
    it('should throw an error if `accessToken` is expired', function() {
      const accessToken = { accessTokenExpiresAt: new Date(new Date() / 2) };
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      try {
        handler.validateAccessToken(accessToken);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidTokenError);
        e.message.should.equal('Invalid token: access token has expired');
      }
    });

    it('should return an access token', function() {
      const accessToken = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      handler.validateAccessToken(accessToken).should.equal(accessToken);
    });
  });

  describe('verifyScope()', function() {
    it('should throw an error if `scope` is insufficient', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {
          return false;
        }
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      return handler.verifyScope('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InsufficientScopeError);
          e.message.should.equal('Insufficient scope: authorized scope is insufficient');
        });
    });

    it('should support promises', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {
          return true;
        }
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      handler.verifyScope('foo').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {
          return true;
        }
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      handler.verifyScope('foo').should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function(token, scope, callback) {
          callback(null, true);
        }
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      handler.verifyScope('foo').should.be.an.instanceOf(Promise);
    });
  });

  describe('updateResponse()', function() {
    it('should not set the `X-Accepted-OAuth-Scopes` header if `scope` is not specified', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: false, model: model });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.headers.should.not.have.property('x-accepted-oauth-scopes');
    });

    it('should set the `X-Accepted-OAuth-Scopes` header if `scope` is specified', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: false, model: model, scope: 'foo bar' });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.get('X-Accepted-OAuth-Scopes').should.equal('foo bar');
    });

    it('should not set the `X-Authorized-OAuth-Scopes` header if `scope` is not specified', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: false, addAuthorizedScopesHeader: true, model: model });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.headers.should.not.have.property('x-oauth-scopes');
    });

    it('should set the `X-Authorized-OAuth-Scopes` header', function() {
      const model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: false, addAuthorizedScopesHeader: true, model: model, scope: 'foo bar' });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.get('X-OAuth-Scopes').should.equal('foo biz');
    });
  });
});
