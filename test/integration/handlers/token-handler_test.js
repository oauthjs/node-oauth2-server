
/**
 * Module dependencies.
 */

var AccessDeniedError = require('../../../lib/errors/access-denied-error');
var BearerTokenType = require('../../../lib/token-types/bearer-token-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidClientError = require('../../../lib/errors/invalid-client-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var Response = require('../../../lib/response');
var ServerError = require('../../../lib/errors/server-error');
var TokenHandler = require('../../../lib/handlers/token-handler');
var UnsupportedGrantTypeError = require('../../../lib/errors/unsupported-grant-type-error');
var should = require('should');
var util = require('util');

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', function() {
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
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: model does not implement `getClient()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      var model = {
        getClient: function() {}
      };

      try {
        new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: model does not implement `saveToken()`');
      }
    });

    it('should set the `accessTokenLifetime`', function() {
      var accessTokenLifetime = {};
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: accessTokenLifetime, model: model, refreshTokenLifetime: 120 });

      handler.accessTokenLifetime.should.equal(accessTokenLifetime);
    });

    it('should set the `extendedGrantTypes`', function() {
      var extendedGrantTypes = { foo: 'bar' };
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, extendedGrantTypes: extendedGrantTypes, model: model, refreshTokenLifetime: 120 });

      handler.grantTypes.should.containEql(extendedGrantTypes);
    });

    it('should set the `model`', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.model.should.equal(model);
    });

    it('should set the `refreshTokenLifetime`', function() {
      var refreshTokenLifetime = {};
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: refreshTokenLifetime });

      handler.refreshTokenLifetime.should.equal(refreshTokenLifetime);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

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
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
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
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
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
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
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
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: {}, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: cannot retrieve client credentials');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', function() {
      var model = {
        getClient: function() {
          return {};
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          throw new Error('Unhandled exception');
        }
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
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
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
        });
    });

    it('should update the response if an error is thrown', function() {
      var model = {
        getClient: function() {
          return {};
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          throw new Error('Unhandled exception');
        }
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
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
          response.status.should.equal(503);
        });
    });

    it('should return a bearer token if successful', function() {
      var token = { accessToken: 'foo', refreshToken: 'bar', accessTokenLifetime: 120, scope: 'foobar' };
      var model = {
        getClient: function() {
          return {};
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return token;
        }
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password'
        },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
        method: 'POST',
        query: {}
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response).then(function(data) {
        data.should.eql(token);
      });
    });
  });

  describe('generateAccessToken()', function() {
    it('should return an access token', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.generateAccessToken().then(function(data) {
        data.should.be.a.sha1;
      });
    });

    it('should support promises', function() {
      var model = {
        generateAccessToken: function() {
          return Promise.resolve({});
        },
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.generateAccessToken().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        generateAccessToken: function() {
          return {};
        },
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.generateAccessToken().should.be.an.instanceOf(Promise);
    });
  });

  describe('generateRefreshToken()', function() {
    it('should return a refresh token', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.generateRefreshToken().then(function(data) {
        data.should.be.a.sha1;
      });
    });
  });

  describe('getAccessTokenLifetime()', function() {
    it('should return a date', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.getAccessTokenLifetime().then(function(data) {
        data.should.be.an.instanceOf(Date);
      });
    });
  });

  describe('getRefreshTokenLifetime()', function() {
    it('should return a date', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.getRefreshTokenLifetime().then(function(data) {
        data.should.be.an.instanceOf(Date);
      });
    });
  });

  describe('getScope()', function() {
    it('should return the scope', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: { scope: 'foo' }, headers: {}, method: {}, query: {} });

      return handler.getScope(request).then(function(scope) {
        scope.should.equal('foo');
      });
    });
  });

  describe('getClient()', function() {
    it('should throw an error if `client` is missing', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should return a client', function() {
      var client = { id: 12345 };
      var model = {
        getClient: function() {
          return client;
        },
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request).then(function(data) {
        data.should.equal(client);
      });
    });

    it('should support promises', function() {
      var model = {
        getClient: function() {
          return Promise.resolve({});
        },
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        getClient: function() {
          return {};
        },
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('getClientCredentials()', function() {
    it('should throw an error if the client credentials are missing', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

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
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
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
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({ body: { client_id: 'foo', client_secret: 'bar' }, headers: {}, method: {}, query: {} });
        var credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });
  });

  describe('handleGrantType()', function() {
    it('should throw an error if `grant_type` is missing', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return handler.handleGrantType(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `grant_type`');
        });
    });

    it('should throw an error if `grant_type` is unsupported', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: { grant_type: 'foobar' }, headers: {}, method: {}, query: {} });

      return handler.handleGrantType(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(UnsupportedGrantTypeError);
          e.message.should.equal('Unsupported grant type: `grant_type` is invalid');
        });
    });

    it('should return a grant type result', function() {
      var user = {};
      var model = {
        getClient: function() {},
        getUser: function() {
          return user;
        },
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var request = new Request({ body: { grant_type: 'password', username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return handler.handleGrantType(request).then(function(data) {
        data.should.equal(user);
      });
    });
  });

  describe('saveToken()', function() {
    it('should return a token', function() {
      var token = {};
      var model = {
        getClient: function() {},
        saveToken: function() {
          return token;
        }
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.saveToken('foo', 'bar', 'biz', 'baz', 'qux', 'fuz').then(function(data) {
        data.should.equal(token);
      });
    });

    it('should support promises', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {
          return Promise.resolve({});
        }
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.saveToken('foo', 'bar', 'biz', 'baz', 'qux', 'fuz').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {
          return {};
        }
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      handler.saveToken('foo', 'bar', 'biz', 'baz', 'qux', 'fuz').should.be.an.instanceOf(Promise);
    });
  });

  describe('handleGrantType()', function() {
    describe('with grant_type `authorization_code`', function() {
      it('should return a user', function() {
        var authCode = { client: {}, user: {} };
        var client = {};
        var model = {
          getAuthCode: function() {
            return authCode;
          },
          getClient: function() {},
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request, client).then(function(data) {
          data.should.equal(authCode);
        });
      });
    });

    describe('with grant_type `client_credentials`', function() {
      it('should return a user', function() {
        var user = {};
        var model = {
          getClient: function() {},
          getUserFromClient: function() {
            return user;
          },
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({
          body: {
            grant_type: 'client_credentials'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request, {})
          .then(function(data) {
            data.should.equal(user);
          })
          .catch(should.fail);
      });
    });

    describe('with grant_type `password`', function() {
      it('should return a user', function() {
        var user = {};
        var model = {
          getClient: function() {},
          getUser: function() {
            return user;
          },
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({
          body: {
            client_id: 12345,
            client_secret: 'secret',
            grant_type: 'password',
            password: 'bar',
            username: 'foo'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request).then(function(data) {
          data.should.equal(user);
        });
      });
    });

    describe('with grant_type `refresh_token`', function() {
      it('should return a user', function() {
        var client = {};
        var refreshToken = { client: {}, user: {} };
        var model = {
          getClient: function() {},
          getRefreshToken: function() {
            return refreshToken;
          },
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({
          body: {
            grant_type: 'refresh_token',
            refresh_token: 12345
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler.handleGrantType(request, client).then(function(data) {
          data.should.equal(refreshToken);
        });
      });
    });
  });

  describe('getUser()', function() {
    describe('with grant_type `authorization_code`', function() {
      it('should return a user', function() {
        var model = {
          getClient: function() {},
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({ body: { grant_type: 'authorization_code' }, headers: {}, method: {}, query: {} });
        var user = {};

        return handler.getUser(request, { user: user }).then(function(data) {
          data.should.equal(user);
        });
      });
    });

    describe('with grant_type `client_credentials`', function() {
      it('should return a user', function() {
        var model = {
          getClient: function() {},
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({ body: { grant_type: 'client_credentials' }, headers: {}, method: {}, query: {} });
        var result = {};

        return handler.getUser(request, result).then(function(data) {
          data.should.equal(result);
        });
      });
    });

    describe('with grant_type `password`', function() {
      it('should return a user', function() {
        var model = {
          getClient: function() {},
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({ body: { grant_type: 'password' }, headers: {}, method: {}, query: {} });
        var result = {};

        return handler.getUser(request, result).then(function(data) {
          data.should.equal(result);
        });
      });
    });

    describe('with grant_type `refresh_token`', function() {
      it('should return a user', function() {
        var model = {
          getClient: function() {},
          saveToken: function() {}
        };
        var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
        var request = new Request({ body: { grant_type: 'refresh_token' }, headers: {}, method: {}, query: {} });
        var user = {};

        return handler.getUser(request, { user: user }).then(function(data) {
          data.should.equal(user);
        });
      });
    });
  });

  describe('getTokenType()', function() {
    it('should return a token type', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var tokenType = handler.getTokenType({ accessToken: 'foo', refreshToken: 'bar', scope: 'foobar' });

      tokenType.should.eql({ accessToken: 'foo', accessTokenLifetime: 120, refreshToken: 'bar', scope: 'foobar' });
    });
  });

  describe('updateSuccessResponse()', function() {
    it('should set the `body`', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var tokenType = new BearerTokenType('foo', 'bar', 'biz');
      var response = new Response({ body: {}, headers: {} });

      return handler.updateSuccessResponse(response, tokenType).then(function() {
        response.body.should.eql({ access_token: 'foo', expires_in: 'bar', refresh_token: 'biz', token_type: 'bearer' });
      });
    });

    it('should set the `Cache-Control` header', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var tokenType = new BearerTokenType('foo', 'bar', 'biz');
      var response = new Response({ body: {}, headers: {} });

      return handler.updateSuccessResponse(response, tokenType).then(function() {
        response.headers.should.containEql({ 'Cache-Control': 'no-store' });
      });
    });

    it('should set the `Pragma` header', function() {
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var tokenType = new BearerTokenType('foo', 'bar', 'biz');
      var response = new Response({ body: {}, headers: {} });

      return handler.updateSuccessResponse(response, tokenType).then(function() {
        response.headers.should.containEql({ 'Pragma': 'no-cache' });
      });
    });
  });

  describe('updateErrorResponse()', function() {
    it('should set the `body`', function() {
      var error = new AccessDeniedError('Cannot request a token');
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var response = new Response({ body: {}, headers: {} });

      return handler.updateErrorResponse(response, error).then(function() {
        response.body.error.should.equal('access_denied');
        response.body.error_description.should.equal('Cannot request a token');
      });
    });

    it('should set the `status`', function() {
      var error = new AccessDeniedError('Cannot request a token');
      var model = {
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      var response = new Response({ body: {}, headers: {} });

      return handler.updateErrorResponse(response, error).then(function() {
        response.status.should.equal(400);
      });
    });
  });
});
