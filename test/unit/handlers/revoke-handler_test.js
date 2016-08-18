'use strict';

/**
 * Module dependencies.
 */

var Request = require('../../../lib/request');
var RevokeHandler = require('../../../lib/handlers/revoke-handler');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `RevokeHandler`.
 */

describe('RevokeHandler', function() {
  describe('handleRevokeToken()', function() {
    it('should call `model.getAccessToken()` and `model.getRefreshToken()`', function() {
      var model = {
        getClient: function() {},
        revokeToken: sinon.stub().returns( true),
        getRefreshToken: sinon.stub().returns({ refreshToken: 'hash', client: {}, refreshTokenExpiresAt: new Date(new Date() * 2), user: {} }),
        getAccessToken: sinon.stub().returns( false)
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { token: 'foo' }, headers: {}, method: {}, query: {} });
      var client = {};

      return handler.handleRevokeToken(request, client)
        .then(function() {
          model.getAccessToken.callCount.should.equal(1);
          model.getAccessToken.firstCall.args[0].should.equal('foo');
          model.getRefreshToken.callCount.should.equal(1);
          model.getRefreshToken.firstCall.args[0].should.equal('foo');
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', function() {
    it('should call `model.getClient()`', function() {
      var model = {
        getClient: sinon.stub().returns({ grants: ['password'] }),
        revokeToken: function() {},
        getRefreshToken: function() {},
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(function() {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(2);
          model.getClient.firstCall.args[0].should.equal(12345);
          model.getClient.firstCall.args[1].should.equal('secret');
        })
        .catch(should.fail);
    });
  });

  describe('getRefreshToken()', function() {
    it('should call `model.getRefreshToken()`', function() {
      var model = {
        getClient: function() {},
        revokeToken: function() {},
        getAccessToken: function() {},
        getRefreshToken: sinon.stub().returns({ refreshToken: 'hash', client: {}, refreshTokenExpiresAt: new Date(new Date() * 2), user: {} })
      };
      var handler = new RevokeHandler({ model: model });
      var token = 'hash';
      var client = {};

      return handler.getRefreshToken(token, client)
        .then(function() {
          model.getRefreshToken.callCount.should.equal(1);
          model.getRefreshToken.firstCall.args.should.have.length(1);
          model.getRefreshToken.firstCall.args[0].should.equal(token);
        })
        .catch(should.fail);
    });
  });

  describe('revokeToken()', function() {
    it('should call `model.revokeToken()`', function() {
      var model = {
        getClient: function() {},
        revokeToken: sinon.stub().returns( true),
        getRefreshToken: sinon.stub().returns({ refreshToken: 'hash', client: {}, refreshTokenExpiresAt: new Date(new Date() * 2), user: {} }),
        getAccessToken: function() {}
      };
      var handler = new RevokeHandler({ model: model });
      var token = 'hash';

      return handler.revokeToken(token)
        .then(function() {
          model.revokeToken.callCount.should.equal(1);
          model.revokeToken.firstCall.args.should.have.length(1);
        })
        .catch(should.fail);
    });
  });
});
