'use strict';

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

    it('should throw an error if the model does not implement `getAuthorizationCode()`', function() {
      try {
        new AuthorizationCodeGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getAuthorizationCode()`');
      }
    });

    it('should throw an error if the model does not implement `revokeAuthorizationCode()`', function() {
      try {
        var model = {
          getAuthorizationCode: function() {}
        };

        new AuthorizationCodeGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `revokeAuthorizationCode()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        var model = {
          getAuthorizationCode: function() {},
          revokeAuthorizationCode: function() {}
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
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
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
    
    it('should throw an error if `client` is invalid', function() {
      var client = {};
      var model = {
        getAuthorizationCode: function() { return { authorizationCode: 12345, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthorizationCode()` did not return a `client` object');
        });
    });

    it('should throw an error if `client` is missing', function() {
      
      var model = {
        getAuthorizationCode: function() { return { authorizationCode: 12345, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        grantType.handle(request, null);
      }
      catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getAuthorizationCode: function() { return { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
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
        getAuthorizationCode: function() { return Promise.resolve({ authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }); },
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var client = { id: 'foobar' };
      var model = {
        getAuthorizationCode: function() { return { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }; },
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var client = { id: 'foobar' };
      var model = {
        getAuthorizationCode: function(code, callback) { callback(null, { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} }); },
        revokeAuthorizationCode: function(code, callback) { callback(null, { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() / 2), user: {} }); },
        saveToken: function(tokenToSave, client, user, callback) { callback(null, tokenToSave); }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthorizationCode()', function() {
    it('should throw an error if the request body does not contain `code`', function() {
      var client = {};
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.getAuthorizationCode(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `code`');
      }
    });

    it('should throw an error if `code` is invalid', function() {
      var client = {};
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getAuthorizationCode(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `code`');
      }
    });

    it('should throw an error if `authorizationCode` is missing', function() {
      var client = {};
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code is invalid');
        });
    });

    it('should throw an error if `authorizationCode.client` is missing', function() {
      var client = {};
      var model = {
        getAuthorizationCode: function() { return { authorizationCode: 12345 }; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthorizationCode()` did not return a `client` object');
        });
    });

    it('should throw an error if `authorizationCode.expiresAt` is missing', function() {
      var client = {};
      var model = {
        getAuthorizationCode: function() { return { authorizationCode: 12345, client: {}, user: {} }; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `expiresAt` must be a Date instance');
        });
    });

    it('should throw an error if `authorizationCode.user` is missing', function() {
      var client = {};
      var model = {
        getAuthorizationCode: function() { return { authorizationCode: 12345, client: {}, expiresAt: new Date() }; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthorizationCode()` did not return a `user` object');
        });
    });

    it('should throw an error if the client id does not match', function() {
      var client = { id: 123 };
      var model = {
        getAuthorizationCode: function() {
          return { authorizationCode: 12345, expiresAt: new Date(), client: { id: 456 }, user: {} };
        },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
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
        getAuthorizationCode: function() {
          return { authorizationCode: 12345, client: { id: 123 }, expiresAt: date, user: {} };
        },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code has expired');
        });
    });

    it('should throw an error if the `redirectUri` is invalid', function() {
      var authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), redirectUri: 'foobar', user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: `redirect_uri` is not a valid URI');
        });
    });

    it('should return an auth code', function() {
      var authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getAuthorizationCode(request, client)
        .then(function(data) {
          data.should.equal(authorizationCode);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthorizationCode: function() { return Promise.resolve(authorizationCode); },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.getAuthorizationCode(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthorizationCode: function() { return authorizationCode; },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.getAuthorizationCode(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var authorizationCode = { authorizationCode: 12345, client: { id: 'foobar' }, expiresAt: new Date(new Date() * 2), user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthorizationCode: function(code, callback) { callback(null, authorizationCode); },
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.getAuthorizationCode(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('validateRedirectUri()', function() {
    it('should throw an error if `redirectUri` is missing', function() {
      var authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), redirectUri: 'http://foo.bar', user: {} };
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return authorizationCode; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: `redirect_uri` is not a valid URI');
      }
    });

    it('should throw an error if `redirectUri` is invalid', function() {
      var authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), redirectUri: 'http://foo.bar', user: {} };
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { code: 12345, redirect_uri: 'http://bar.foo' }, headers: {}, method: {}, query: {} });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: `redirect_uri` is invalid');
      }
    });
  });

  describe('revokeAuthorizationCode()', function() {
    it('should revoke the auth code', function() {
      var authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return true; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.revokeAuthorizationCode(authorizationCode)
        .then(function(data) {
          data.should.equal(authorizationCode);
        })
        .catch(should.fail);
    });

    it('should throw an error when the auth code is invalid', function() {
      var authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return false; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.revokeAuthorizationCode(authorizationCode)
        .then(function(data) {
          data.should.equal(authorizationCode);
        })
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code is invalid');
        });
    });

    it('should support promises', function() {
      var authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return Promise.resolve(true); },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeAuthorizationCode(authorizationCode).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() { return authorizationCode; },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeAuthorizationCode(authorizationCode).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var authorizationCode = { authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function(code, callback) { callback(null, authorizationCode); },
        saveToken: function() {}
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeAuthorizationCode(authorizationCode).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      var token = {};
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
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
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var token = {};
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      var grantType = new AuthorizationCodeGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
