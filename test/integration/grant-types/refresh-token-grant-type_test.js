
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var RefreshTokenGrantType = require('../../../lib/grant-types/refresh-token-grant-type');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var ServerError = require('../../../lib/errors/server-error');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `RefreshTokenGrantType`.
 */

describe('RefreshTokenGrantType', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new RefreshTokenGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getRefreshToken()`', function() {
      try {
        new RefreshTokenGrantType({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: model does not implement `getRefreshToken()`');
      }
    });

    it('should set the `model`', function() {
      var model = { getRefreshToken: function() {} };
      var grantType = new RefreshTokenGrantType(model);

      grantType.model.should.equal(model);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var grantType = new RefreshTokenGrantType({ getRefreshToken: function() {} });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `refreshToken.client` is missing', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {
          return Promise.resolve({ expires: new Date() * 10 });
        }
      };
      var grantType = new RefreshTokenGrantType(model);
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `client` object');
        });
    });

    it('should throw an error if `refreshToken.user` is missing', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {
          return Promise.resolve({ client: {}, expires: new Date() * 10 });
        }
      };
      var grantType = new RefreshTokenGrantType(model);
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `user` object');
        });
    });

    it('should throw an error if the client id does not match', function() {
      var client = { id: 123 };
      var model = {
        getRefreshToken: function() {
          return { client: { id: 456 }, user: {} };
        }
      };
      var grantType = new RefreshTokenGrantType(model);
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if the request body does not contain `refresh_token`', function() {
      var client = {};
      var grantType = new RefreshTokenGrantType({ getRefreshToken: function() {} });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `refresh_token`');
        });
    });

    it('should throw an error if `refresh_token` is invalid', function() {
      var client = {};
      var grantType = new RefreshTokenGrantType({ getRefreshToken: function() {} });
      var request = new Request({ body: { refresh_token: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `refresh_token`');
        });
    });

    it('should throw an error if `refresh_token` is missing', function() {
      var client = {};
      var grantType = new RefreshTokenGrantType({ getRefreshToken: function() {} });
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` is expired', function() {
      var client = {};
      var date = new Date(new Date() / 2);
      var model = {
        getRefreshToken: function() {
          return Promise.resolve({ client: {}, expires: date, user: {} });
        }
      };
      var grantType = new RefreshTokenGrantType(model);
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token has expired');
        });
    });

    it('should return a refresh token', function() {
      var client = {};
      var date = new Date(new Date() * 2);
      var refreshToken = { client: {}, expires: date, user: {} };
      var model = {
        getRefreshToken: sinon.stub().returns(refreshToken)
      };
      var grantType = new RefreshTokenGrantType(model);
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(refreshToken);
        })
        .catch(should.fail);
    });

    it('should support promises when calling `model.getRefreshToken()`', function() {
      var client = {};
      var refreshToken = { client: {}, user: {} };
      var model = {
        getRefreshToken: function() {
          return Promise.resolve(refreshToken);
        }
      };
      var grantType = new RefreshTokenGrantType(model);
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises when calling `model.getRefreshToken()`', function() {
      var client = {};
      var refreshToken = { client: {}, user: {} };
      var model = {
        getRefreshToken: function() {
          return refreshToken;
        }
      };
      var grantType = new RefreshTokenGrantType(model);
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });
});
