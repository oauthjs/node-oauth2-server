
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
var sinon = require('sinon');
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
        new AuthorizationCodeGrantType({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: model does not implement `getAuthCode()`');
      }
    });

    it('should set the `model`', function() {
      var model = {
        getAuthCode: function() {}
      };
      var grantType = new AuthorizationCodeGrantType(model);

      grantType.model.should.equal(model);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var grantType = new AuthorizationCodeGrantType({ getAuthCode: function() {} });

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
        getAuthCode: function() {
          return Promise.resolve({});
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthCode()` did not return a `client` object');
        });
    });

    it('should throw an error if the request body does not contain `code`', function() {
      var client = {};
      var grantType = new AuthorizationCodeGrantType({ getAuthCode: function() {} });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `code`');
        });
    });

    it('should throw an error if `code` is invalid', function() {
      var client = {};
      var grantType = new AuthorizationCodeGrantType({ getAuthCode: function() {} });
      var request = new Request({ body: { code: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `code`');
        });
    });

    it('should throw an error if `authCode` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() {
          return Promise.resolve();
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code is invalid');
        });
    });

    it('should throw an error if `authCode.client` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() {
          return Promise.resolve({});
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getAuthCode()` did not return a `client` object');
        });
    });

    it('should throw an error if `authCode.user` is missing', function() {
      var client = {};
      var model = {
        getAuthCode: function() {
          return Promise.resolve({ client: {} });
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
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
          return { client: { id: 456 }, user: {} };
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
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
          return Promise.resolve({ client: { id: 123 }, expiresOn: date, user: {} });
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: authorization code has expired');
        });
    });

    it('should return an auth code', function() {
      var authCode = { authCode: 12345, client: { id: 'foobar' }, user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: sinon.stub().returns(authCode)
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(authCode);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var authCode = { authCode: 12345, client: { id: 'foobar' }, user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: function() {
          return Promise.resolve(authCode);
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var authCode = { authCode: 12345, client: { id: 'foobar' }, user: {} };
      var client = { id: 'foobar' };
      var model = {
        getAuthCode: function() {
          return authCode;
        }
      };
      var grantType = new AuthorizationCodeGrantType(model);
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });
});
