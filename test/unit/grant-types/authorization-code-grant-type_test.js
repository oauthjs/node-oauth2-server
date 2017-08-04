'use strict';

/**
 * Module dependencies.
 */

var AuthorizationCodeGrantType = require('../../../lib/grant-types/authorization-code-grant-type');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `AuthorizationCodeGrantType`.
 */

describe('AuthorizationCodeGrantType', function() {
  describe('getAuthorizationCode()', function() {
    it('should call `model.getAuthorizationCode()`', function() {
      var model = {
        getAuthorizationCode: sinon.stub().returns({ authorizationCode: 12345, client: {}, expiresAt: new Date(new Date() * 2), user: {} }),
        revokeAuthorizationCode: function() {},
        saveToken: function() {}
      };
      var handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });
      var client = {};

      return handler.getAuthorizationCode(request, client)
        .then(function() {
          model.getAuthorizationCode.callCount.should.equal(1);
          model.getAuthorizationCode.firstCall.args.should.have.length(1);
          model.getAuthorizationCode.firstCall.args[0].should.equal(12345);
          model.getAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('revokeAuthorizationCode()', function() {
    it('should call `model.revokeAuthorizationCode()`', function() {
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: sinon.stub().returns(true),
        saveToken: function() {}
      };
      var handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });
      var authorizationCode = {};

      return handler.revokeAuthorizationCode(authorizationCode)
        .then(function() {
          model.revokeAuthorizationCode.callCount.should.equal(1);
          model.revokeAuthorizationCode.firstCall.args.should.have.length(1);
          model.revokeAuthorizationCode.firstCall.args[0].should.equal(authorizationCode);
          model.revokeAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var client = {};
      var user = {};
      var model = {
        getAuthorizationCode: function() {},
        revokeAuthorizationCode: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });

      sinon.stub(handler, 'validateScope').returns('foobiz');
      sinon.stub(handler, 'generateAccessToken').returns(Promise.resolve('foo'));
      sinon.stub(handler, 'generateRefreshToken').returns(Promise.resolve('bar'));
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns(Promise.resolve('biz'));
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns(Promise.resolve('baz'));

      return handler.saveToken(user, client, 'foobar', 'foobiz')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', authorizationCode: 'foobar', accessTokenExpiresAt: 'biz', refreshToken: 'bar', refreshTokenExpiresAt: 'baz', scope: 'foobiz' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
