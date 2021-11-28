'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('../../../lib/grant-types/abstract-grant-type');
const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const Promise = require('bluebird');
const Request = require('../../../lib/request');
const should = require('chai').should();

/**
 * Test `AbstractGrantType` integration.
 */

describe('AbstractGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.accessTokenLifetime` is missing', function() {
      try {
        new AbstractGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', function() {
      try {
        new AbstractGrantType({ accessTokenLifetime: 123 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should set the `accessTokenLifetime`', function() {
      const grantType = new AbstractGrantType({ accessTokenLifetime: 123, model: {} });

      grantType.accessTokenLifetime.should.equal(123);
    });

    it('should set the `model`', function() {
      const model = {};
      const grantType = new AbstractGrantType({ accessTokenLifetime: 123, model: model });

      grantType.model.should.equal(model);
    });

    it('should set the `refreshTokenLifetime`', function() {
      const grantType = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      grantType.refreshTokenLifetime.should.equal(456);
    });
  });

  describe('generateAccessToken()', function() {
    it('should return an access token', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      return handler.generateAccessToken()
        .then(function(data) {
          data.should.be.a.sha256();
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const model = {
        generateAccessToken: function() {
          return Promise.resolve({});
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });

      handler.generateAccessToken().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        generateAccessToken: function() {
          return {};
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });

      handler.generateAccessToken().should.be.an.instanceOf(Promise);
    });
  });

  describe('generateRefreshToken()', function() {
    it('should return a refresh token', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      return handler.generateRefreshToken()
        .then(function(data) {
          data.should.be.a.sha256();
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const model = {
        generateRefreshToken: function() {
          return Promise.resolve({});
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });

      handler.generateRefreshToken().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const model = {
        generateRefreshToken: function() {
          return {};
        }
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: model, refreshTokenLifetime: 456 });

      handler.generateRefreshToken().should.be.an.instanceOf(Promise);
    });
  });

  describe('getAccessTokenExpiresAt()', function() {
    it('should return a date', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      handler.getAccessTokenExpiresAt().should.be.an.instanceOf(Date);
    });
  });

  describe('getRefreshTokenExpiresAt()', function() {
    it('should return a refresh token', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });

      handler.getRefreshTokenExpiresAt().should.be.an.instanceOf(Date);
    });
  });

  describe('getScope()', function() {
    it('should throw an error if `scope` is invalid', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const request = new Request({ body: { scope: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        handler.getScope(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid parameter: `scope`');
      }
    });

    it('should allow the `scope` to be `undefined`', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      should.not.exist(handler.getScope(request));
    });

    it('should return the scope', function() {
      const handler = new AbstractGrantType({ accessTokenLifetime: 123, model: {}, refreshTokenLifetime: 456 });
      const request = new Request({ body: { scope: 'foo' }, headers: {}, method: {}, query: {} });

      handler.getScope(request).should.equal('foo');
    });
  });
});
