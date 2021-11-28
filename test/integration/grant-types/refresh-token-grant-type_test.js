'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const Promise = require('bluebird');
const RefreshTokenGrantType = require('../../../lib/grant-types/refresh-token-grant-type');
const Request = require('../../../lib/request');
const ServerError = require('../../../lib/errors/server-error');
const should = require('chai').should();

/**
 * Test `RefreshTokenGrantType` integration.
 */

describe('RefreshTokenGrantType integration', function() {
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
        new RefreshTokenGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getRefreshToken()`');
      }
    });

    it('should throw an error if the model does not implement `revokeToken()`', function() {
      try {
        const model = {
          getRefreshToken: function() {}
        };

        new RefreshTokenGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `revokeToken()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        const model = {
          getRefreshToken: function() {},
          revokeToken: function() {}
        };

        new RefreshTokenGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', function() {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() { return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: function() { return token; }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function() { return Promise.resolve({ accessToken: 'foo', client: { id: 123 }, user: {} }); },
        revokeToken: function() { return Promise.resolve({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }); },
        saveToken: function() { return Promise.resolve({ accessToken: 'foo', client: {}, user: {} }); }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function() { return { accessToken: 'foo', client: { id: 123 }, user: {} }; },
        revokeToken: function() { return { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: function() { return { accessToken: 'foo', client: {}, user: {} }; }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function(refreshToken, callback) { callback(null, { accessToken: 'foo', client: { id: 123 }, user: {} }); },
        revokeToken: function(refreshToken, callback) { callback(null, { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }); },
        saveToken: function(tokenToSave, client, user, callback) { callback(null,{ accessToken: 'foo', client: {}, user: {} }); }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getRefreshToken()', function() {
    it('should throw an error if the `refreshToken` parameter is missing from the request body', function() {
      const client = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refreshToken` is not found', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function() { return; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: '12345' }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refreshToken.client` is missing', function() {
      const client = {};
      const model = {
        getRefreshToken: function() { return {}; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `client` object');
        });
    });

    it('should throw an error if `refreshToken.user` is missing', function() {
      const client = {};
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `user` object');
        });
    });

    it('should throw an error if the client id does not match', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` contains invalid characters', function() {
      const client = {};
      const model = {
        getRefreshToken: function() {
          return { client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refresh_token` is missing', function() {
      const client = {};
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` is expired', function() {
      const client = { id: 123 };
      const date = new Date(new Date() / 2);
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: date, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token has expired');
        });
    });

    it('should throw an error if `refreshTokenExpiresAt` is not a date value', function() {
      const client = { id: 123 };
      const model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: 'stringvalue', user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `refreshTokenExpiresAt` must be a Date instance');
        });
    });

    it('should return a token', function() {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: function() { return Promise.resolve(token); },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.getRefreshToken(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.getRefreshToken(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: function(refreshToken, callback) { callback(null, token); },
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.getRefreshToken(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('revokeToken()', function() {
    it('should throw an error if the `token` is invalid', function() {
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });

      grantType.revokeToken({})
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should revoke the token', function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() { return token; },
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.revokeToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() { return Promise.resolve(token); },
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() { return token; },
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      const model = {
        getRefreshToken: function() {},
        revokeToken: function(refreshToken, callback) { callback(null, token); },
        saveToken: function() {}
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      const token = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() { return token; }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const token = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() { return token; }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const token = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      const grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
