
/**
 * Module dependencies.
 */

var AccessDeniedError = require('../../../lib/errors/access-denied-error');
var AuthenticateHandler = require('../../../lib/handlers/authenticate-handler');
var AuthorizeHandler = require('../../../lib/handlers/authorize-handler');
var CodeResponseType = require('../../../lib/response-types/code-response-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidClientError = require('../../../lib/errors/invalid-client-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var Response = require('../../../lib/response');
var ServerError = require('../../../lib/errors/server-error');
var UnauthorizedClientError = require('../../../lib/errors/unauthorized-client-error');
var should = require('should');
var url = require('url');

/**
 * Test `AuthorizeHandler` integration.
 */

describe('AuthorizeHandler integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.authCodeLifetime` is missing', function() {
      try {
        new AuthorizeHandler();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `authCodeLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', function() {
      try {
        new AuthorizeHandler({ authCodeLifetime: 120 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', function() {
      try {
        new AuthorizeHandler({ authCodeLifetime: 120, model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getClient()`');
      }
    });

    it('should throw an error if the model does not implement `saveAuthCode()`', function() {
      try {
        new AuthorizeHandler({ authCodeLifetime: 120, model: { getClient: function() {} } });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveAuthCode()`');
      }
    });

    it('should throw an error if the model does not implement `getAccessToken()`', function() {
      var model = {
        getClient: function() {},
        saveAuthCode: function() {}
      };

      try {
        new AuthorizeHandler({ authCodeLifetime: 120, model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getAccessToken()`');
      }
    });

    it('should set the `authCodeLifetime`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      handler.authCodeLifetime.should.equal(120);
    });

    it('should set the `authenticateHandler`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      handler.authenticateHandler.should.be.an.instanceOf(AuthenticateHandler);
    });

    it('should set the `model`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      handler.model.should.equal(model);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

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
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        handler.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: `response` must be an instance of Response');
      }
    });

    it('should throw an error if `allowed` is `false`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: { allowed: 'false' } });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(AccessDeniedError);
          e.message.should.equal('Access denied: user denied access to application');
        });
    });

    it('should redirect to an error response if a non-oauth error is thrown', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        },
        saveAuthCode: function() {
          throw new Error('Unhandled exception');
        }
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function() {
          response.get('location').should.equal('http://example.com/cb?error=server_error&error_description=Unhandled%20exception&state=foobar');
        });
    });

    it('should redirect to an error response if an oauth error is thrown', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        },
        saveAuthCode: function() {
          throw new AccessDeniedError('Cannot request this auth code');
        }
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(should.fail)
        .catch(function() {
          response.get('location').should.equal('http://example.com/cb?error=access_denied&error_description=Cannot%20request%20this%20auth%20code&state=foobar');
        });
    });

    it('should redirect to a successful response with `code` and `state` if successful', function() {
      var client = { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
      var model = {
        getAccessToken: function() {
          return { client: client, user: {} };
        },
        getClient: function() {
          return client;
        },
        saveAuthCode: function() {
          return { authCode: 12345, client: client };
        }
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function() {
          response.get('location').should.equal('http://example.com/cb?code=12345&state=foobar');
        })
        .catch(should.fail);
    });

    it('should return the `code` if successful', function() {
      var client = { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
      var model = {
        getAccessToken: function() {
          return { client: client, user: {} };
        },
        getClient: function() {
          return client;
        },
        saveAuthCode: function() {
          return { authCode: 12345, client: client };
        }
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          'Authorization': 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      var response = new Response({ body: {}, headers: {} });

      return handler.handle(request, response)
        .then(function(data) {
          data.should.eql({
            authCode: 12345,
            client: client
          });
        })
        .catch(should.fail);
    });
  });

  describe('generateAuthCode()', function() {
    it('should return an auth code', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      return handler.generateAuthCode()
        .then(function(data) {
          data.should.be.a.sha1;
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var model = {
        generateAuthCode: function() {
          return Promise.resolve({});
        },
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      handler.generateAuthCode().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        generateAuthCode: function() {
          return {};
        },
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      handler.generateAuthCode().should.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthCodeLifetime()', function() {
    it('should return a date', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      return handler.getAuthCodeLifetime()
        .then(function(data) {
          data.should.be.an.instanceOf(Date);
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', function() {
    it('should throw an error if `client_id` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `client_id`');
        });
    });

    it('should throw an error if `client_id` is invalid', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 'øå€£‰', response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `client_id`');
        });
    });

    it('should throw an error if `client.redirectUri` is invalid', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, response_type: 'code', redirect_uri: 'foobar' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: `redirect_uri` is not a valid URI');
        });
    });

    it('should throw an error if `client` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client credentials are invalid');
        });
    });

    it('should throw an error if `client` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client credentials are invalid');
        });
    });

    it('should throw an error if `client.grants` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {
          return {};
        },
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: missing client `grants`');
        });
    });

    it('should throw an error if `client` is unauthorized', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {
          return { grants: [] };
        },
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(UnauthorizedClientError);
          e.message.should.equal('Unauthorized client: `grant_type` is invalid');
        });
    });

    it('should throw an error if `client.redirectUri` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() { return { grants: ['authorization_code'] }; },
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: missing client `redirectUri`');
        });
    });

    it('should throw an error if `client.redirectUri` is not equal to `redirectUri`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {
          return { grants: ['authorization_code'], redirectUri: 'https://example.com' };
        },
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, response_type: 'code', redirect_uri: 'https://foobar.com' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: `redirect_uri` does not match client value');
        });
    });

    it('should support promises', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {
          return Promise.resolve({ grants: ['authorization_code'], redirectUri: 'http://example.com/cb' });
        },
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {
          return { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        },
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    describe('with `client_id` in the request body', function() {
      it('should return a client', function() {
        var client = { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        var model = {
          getAccessToken: function() {},
          getClient: function() {
            return client;
          },
          saveAuthCode: function() {}
        };
        var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
        var request = new Request({ body: { client_id: 12345, response_type: 'code' }, headers: {}, method: {}, query: {} });

        return handler.getClient(request)
          .then(function(data) {
            data.should.equal(client);
          })
          .catch(should.fail);
      });
    });

    describe('with `client_id` in the request query', function() {
      it('should return a client', function() {
        var client = { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        var model = {
          getAccessToken: function() {},
          getClient: function() {
            return client;
          },
          saveAuthCode: function() {}
        };
        var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
        var request = new Request({ body: { response_type: 'code' }, headers: {}, method: {}, query: { client_id: 12345 } });

        return handler.getClient(request)
          .then(function(data) {
            data.should.equal(client);
          })
          .catch(should.fail);
      });
    });
  });

  describe('getScope()', function() {
    it('should throw an error if `scope` is invalid', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { scope: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      return handler.getScope(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidArgumentError);
          e.message.should.equal('Invalid parameter: `scope`');
        });
    });

    it('should return the scope', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { scope: 'foo' }, headers: {}, method: {}, query: {} });

      return handler.getScope(request)
        .then(function(scope) {
          scope.should.equal('foo');
        })
        .catch(should.fail);
    });
  });

  describe('getState()', function() {
    it('should throw an error if `state` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return handler.getState(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `state`');
        });
    });

    it('should throw an error if `state` is invalid', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: { state: 'øå€£‰' } });

      return handler.getState(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `state`');
        });
    });

    describe('with `state` in the request body', function() {
      it('should return the state', function() {
        var model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthCode: function() {}
        };
        var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
        var request = new Request({ body: { state: 'foobar' }, headers: {}, method: {}, query: {} });

        return handler.getState(request)
          .then(function(data) {
            data.should.equal('foobar');
          })
          .catch(should.fail);
      });
    });

    describe('with `state` in the request query', function() {
      it('should return the state', function() {
        var model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthCode: function() {}
        };
        var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
        var request = new Request({ body: {}, headers: {}, method: {}, query: { state: 'foobar' } });

        return handler.getState(request)
          .then(function(data) {
            data.should.equal('foobar');
          })
          .catch(should.fail);
      });
    });
  });

  describe('getUser()', function() {
    it('should return a user', function() {
      var user = {};
      var model = {
        getAccessToken: function() {
          return { user: user };
        },
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });

      return handler.getUser(request)
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });
  });

  describe('saveAuthCode()', function() {
    it('should return an auth code', function() {
      var authCode = {};
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {
          return authCode;
        }
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      return handler.saveAuthCode('foo', 'bar', 'biz', 'baz')
        .then(function(data) {
          data.should.equal(authCode);
        })
        .catch(should.fail);
    });

    it('should support promises when calling `model.saveAuthCode()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {
          return Promise.resolve({});
        }
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      handler.saveAuthCode('foo', 'bar', 'biz', 'baz').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises when calling `model.saveAuthCode()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {
          return {};
        }
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      handler.saveAuthCode('foo', 'bar', 'biz', 'baz').should.be.an.instanceOf(Promise);
    });
  });

  describe('getResponseType()', function() {
    it('should throw an error if `response_type` is missing', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        handler.getResponseType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `response_type`');
      }
    });

    it('should throw an error if `response_type` is not `code`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { response_type: 'foobar' }, headers: {}, method: {}, query: {} });

      try {
        handler.getResponseType(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `response_type`');
      }
    });

    describe('with `response_type` in the request body', function() {
      it('should return a response type', function() {
        var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
        var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
        var request = new Request({ body: { response_type: 'code' }, headers: {}, method: {}, query: {} });
        var responseType = handler.getResponseType(request, { authCode: 123 });

        responseType.should.be.an.instanceOf(CodeResponseType);
      });
    });

    describe('with `response_type` in the request query', function() {
      it('should return a response type', function() {
        var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
        var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
        var request = new Request({ body: {}, headers: {}, method: {}, query: { response_type: 'code' } });
        var responseType = handler.getResponseType(request, { authCode: 123 });

        responseType.should.be.an.instanceOf(CodeResponseType);
      });
    });
  });

  describe('buildSuccessRedirectUri()', function() {
    it('should return a redirect uri', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var responseType = new CodeResponseType(12345);
      var redirectUri = handler.buildSuccessRedirectUri('http://example.com/cb', responseType);

      url.format(redirectUri).should.equal('http://example.com/cb?code=12345');
    });
  });

  describe('buildErrorRedirectUri()', function() {
    it('should set `error_description` if available', function() {
      var error = new InvalidClientError('foo bar');
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var redirectUri = handler.buildErrorRedirectUri('http://example.com/cb', error);

      url.format(redirectUri).should.equal('http://example.com/cb?error=invalid_client&error_description=foo%20bar');
    });

    it('should return a redirect uri', function() {
      var error = new InvalidClientError();
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var redirectUri = handler.buildErrorRedirectUri('http://example.com/cb', error);

      url.format(redirectUri).should.equal('http://example.com/cb?error=invalid_client');
    });
  });

  describe('updateResponse()', function() {
    it('should set the `location` header', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var response = new Response({ body: {}, headers: {} });
      var uri = url.parse('http://example.com/cb');

      handler.updateResponse(response, uri, 'foobar');

      response.get('location').should.equal('http://example.com/cb?state=foobar');
    });
  });
});
