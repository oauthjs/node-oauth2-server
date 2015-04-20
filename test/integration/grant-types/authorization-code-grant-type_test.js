
/**
 * Module dependencies.
 */

var AuthorizationCodeGrantType = require('../../../lib/grant-types/authorization-code-grant-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var ServerError = require('../../../lib/errors/server-error');
var should = require('should');

/**
 * Test `AuthorizationCodeGrantType` integration.
 */

describe('AuthorizationCodeGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new AuthorizationCodeGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getAuthCode()`', function() {
      try {
        new AuthorizationCodeGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getAuthCode()`');
      }
    });

    it('should throw an error if the model does not implement `revokeAuthCode()`', function() {
      try {
        var model = {
          getAuthCode: function() {}
        };

        new AuthorizationCodeGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `revokeAuthCode()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        var model = {
          getAuthCode: function() {},
          revokeAuthCode: function() {}
        };

        new AuthorizationCodeGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() { return { authCode: 12345, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthCode()` did not return a `client` object');
        });
    });

    it('should return a token', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getAuthCode: function() { return { authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthCode: function() { return { authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: function() { return token; }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: function() { return Promise.resolve({ authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }); },
        revokeAuthCode: function() { return Promise.resolve({ authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() / 2), user: {} }) },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: function() { return { authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthCode: function() { return { authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthCode()', function() {
    it('should throw an error if the request body does not contain `code`', function() {
      var client = {};
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `code`');
        });
    });

    it('should throw an error if `code` is invalid', function() {
      var client = {};
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `code`');
        });
    });

    it('should throw an error if `authCode` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code is invalid');
        });
    });

    it('should throw an error if `authCode.client` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() { return { authCode: 12345 }; },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthCode()` did not return a `client` object');
        });
    });

    it('should throw an error if `authCode.expiresAt` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() { return { authCode: 12345, client: {}, user: {} }; },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `expiresAt` must be a Date instance');
        });
    });

    it('should throw an error if `authCode.user` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() { return { authCode: 12345, client: {}, expiresAt: new Date() }; },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthCode()` did not return a `user` object');
        });
    });

    it('should throw an error if the client id does not match', function() {
      var client = { id: 123 };
      var model = {
        getAuthCode: function() {
          return { authCode: 12345, expiresAt: new Date(), client: { id: 456 }, user: {} };
        },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code is invalid');
        });
    });

    it('should throw an error if the auth code is expired', function() {
      var client = { id: 123 };
      var date = new Date(new Date() / 2);
      var model = {
        getAuthCode: function() {
          return { authCode: 12345, client: { id: 123 }, expiresAt: date, user: {} };
        },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code has expired');
        });
    });

    it('should return an auth code', function() {
      var authCode = { authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: function() { return authCode; },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthCode(request, client)
        .then(function(data) {
          data.should.equal(authCode);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var authCode = { authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: function() { return Promise.resolve(authCode); },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.getAuthCode(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var authCode = { authCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: function() { return authCode; },
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.getAuthCode(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('revokeAuthCode()', function() {
    it('should revoke the auth code', function() {
      var authCode = { authCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() { return authCode; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.revokeAuthCode(authCode)
        .then(function(data) {
          data.should.equal(authCode);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var authCode = { authCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() { return Promise.resolve(authCode); },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeAuthCode(authCode).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var authCode = { authCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() { return authCode; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeAuthCode(authCode).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      var token = {};
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = {};
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
