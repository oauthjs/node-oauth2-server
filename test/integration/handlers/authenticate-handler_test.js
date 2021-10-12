'use strict';

/**
 * Module dependencies.
 */

var AccessDeniedError = require('../../../lib/errors/access-denied-error');
var AuthenticateHandler = require('../../../lib/handlers/authenticate-handler');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var InsufficientScopeError = require('../../../lib/errors/insufficient-scope-error');
var InvalidTokenError = require('../../../lib/errors/invalid-token-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var Response = require('../../../lib/response');
var ServerError = require('../../../lib/errors/server-error');
var UnauthorizedRequestError = require('../../../lib/errors/unauthorized-request-error');
var should = require('chai').should();

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
      var model = { getAccessToken: function() {} };
      var grantType = new AuthenticateHandler({ model: model });

      grantType.model.should.equal(model);
    });

    it('should set the `scope`', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      var grantType = new AuthenticateHandler({
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
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      try {
        handler.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `request` must be an instance of Request');
      }
    });

    it('should set the `WWW-Authenticate` header if an unauthorized request error is thrown', function() {
      var model = {
        getAccessToken: function() {
          throw new UnauthorizedRequestError();
        }
      };
      var handler = new AuthenticateHandler({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function() {
          response.get('WWW-Authenticate').should.equal('Bearer realm="Service"');
        });
    });

    it('should throw the error if an oauth error is thrown', function() {
      var model = {
        getAccessToken: function() {
          throw new AccessDeniedError('Cannot request this access token');
        }
      };
      var handler = new AuthenticateHandler({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(AccessDeniedError);
          e.message.should.equal('Cannot request this access token');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', function() {
      var model = {
        getAccessToken: function() {
          throw new Error('Unhandled exception');
        }
      };
      var handler = new AuthenticateHandler({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
        });
    });

    it('should return an access token', function() {
      var accessToken = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      var model = {
        getAccessToken: function() {
          return accessToken;
        },
        verifyScope: function() {
          return true;
        }
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });
      var request = new Request({
        body: {},
        headers: { 'Authorization': 'Bearer foo' },
        method: {},
        query: {}
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function(data) {
          data.should.equal(accessToken);
        })
        .catch(should.fail);
    });
  });

  describe('getTokenFromRequest()', function() {
    it('should throw an error if more than one authentication method is used', function() {
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      var request = new Request({
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
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

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
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      var request = new Request({
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
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      var request = new Request({
        body: {},
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {}
      });

      var bearerToken = handler.getTokenFromRequestHeader(request);

      bearerToken.should.equal('foo');
    });
  });

  describe('getTokenFromRequestQuery()', function() {
    it('should throw an error if the query contains a token', function() {
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      try {
        handler.getTokenFromRequestQuery();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: do not send bearer tokens in query URLs');
      }
    });

    it('should return the bearer token if `allowBearerTokensInQueryString` is true', function() {
      var handler = new AuthenticateHandler({ allowBearerTokensInQueryString: true, model: { getAccessToken: function() {} } });

      handler.getTokenFromRequestQuery({ query: { access_token: 'foo' } }).should.equal('foo');
    });
  });

  describe('getTokenFromRequestBody()', function() {
    it('should throw an error if the method is `GET`', function() {
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      var request = new Request({
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
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      var request = new Request({
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
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
      var request = new Request({
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
      var model = {
        getAccessToken: function() {}
      };
      var handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: access token is invalid');
        });
    });

    it('should throw an error if `accessToken.user` is missing', function() {
      var model = {
        getAccessToken: function() {
          return {};
        }
      };
      var handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAccessToken()` did not return a `user` object');
        });
    });

    it('should return an access token', function() {
      var accessToken = { user: {} };
      var model = {
        getAccessToken: function() {
          return accessToken;
        }
      };
      var handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(function(data) {
          data.should.equal(accessToken);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var model = {
        getAccessToken: function() {
          return Promise.resolve({ user: {} });
        }
      };
      var handler = new AuthenticateHandler({ model: model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        }
      };
      var handler = new AuthenticateHandler({ model: model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var model = {
        getAccessToken: function(token, callback) {
          callback(null, { user: {} });
        }
      };
      var handler = new AuthenticateHandler({ model: model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });
  });

  describe('validateAccessToken()', function() {
    it('should throw an error if `accessToken` is expired', function() {
      var accessToken = { accessTokenExpiresAt: new Date(new Date() / 2) };
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      try {
        handler.validateAccessToken(accessToken);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidTokenError);
        e.message.should.equal('Invalid token: access token has expired');
      }
    });

    it('should return an access token', function() {
      var accessToken = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });

      handler.validateAccessToken(accessToken).should.equal(accessToken);
    });
  });

  describe('verifyScope()', function() {
    it('should throw an error if `scope` is insufficient', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {
          return false;
        }
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      return handler.verifyScope('foo')
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InsufficientScopeError);
          e.message.should.equal('Insufficient scope: authorized scope is insufficient');
        });
    });

    it('should support promises', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {
          return true;
        }
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      handler.verifyScope('foo').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {
          return true;
        }
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      handler.verifyScope('foo').should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function(token, scope, callback) {
          callback(null, true);
        }
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'foo' });

      handler.verifyScope('foo').should.be.an.instanceOf(Promise);
    });
  });

  describe('updateResponse()', function() {
    it('should not set the `X-Accepted-OAuth-Scopes` header if `scope` is not specified', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: false, model: model });
      var response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.headers.should.not.have.property('x-accepted-oauth-scopes');
    });

    it('should set the `X-Accepted-OAuth-Scopes` header if `scope` is specified', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: false, model: model, scope: 'foo bar' });
      var response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.get('X-Accepted-OAuth-Scopes').should.equal('foo bar');
    });

    it('should not set the `X-Authorized-OAuth-Scopes` header if `scope` is not specified', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: false, addAuthorizedScopesHeader: true, model: model });
      var response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.headers.should.not.have.property('x-oauth-scopes');
    });

    it('should set the `X-Authorized-OAuth-Scopes` header', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: function() {}
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: false, addAuthorizedScopesHeader: true, model: model, scope: 'foo bar' });
      var response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' });

      response.get('X-OAuth-Scopes').should.equal('foo biz');
    });
  });
});
