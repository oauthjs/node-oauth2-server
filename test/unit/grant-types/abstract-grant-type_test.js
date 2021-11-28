'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('../../../lib/grant-types/abstract-grant-type');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `AbstractGrantType`.
 */

describe('AbstractGrantType', function() {
  describe('generateAccessToken()', function() {
    it('should call `model.generateAccessToken()`', function() {
      const model = {
        generateAccessToken: sinon.stub().returns({ client: {}, expiresAt: new Date(), user: {} })
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 120, model: model });

      return handler.generateAccessToken()
        .then(function() {
          model.generateAccessToken.callCount.should.equal(1);
          model.generateAccessToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('generateRefreshToken()', function() {
    it('should call `model.generateRefreshToken()`', function() {
      const model = {
        generateRefreshToken: sinon.stub().returns({ client: {}, expiresAt: new Date(new Date() / 2), user: {} })
      };
      const handler = new AbstractGrantType({ accessTokenLifetime: 120, model: model });

      return handler.generateRefreshToken()
        .then(function() {
          model.generateRefreshToken.callCount.should.equal(1);
          model.generateRefreshToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
