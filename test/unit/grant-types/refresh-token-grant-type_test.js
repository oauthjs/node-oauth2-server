'use strict';

/**
 * Module dependencies.
 */

var RefreshTokenGrantType = require('../../../lib/grant-types/refresh-token-grant-type');
var Request = require('../../../lib/request');
var sinon = require('sinon');
var should = require('chai').should();

/**
 * Test `RefreshTokenGrantType`.
 */

describe('RefreshTokenGrantType', function() {
  describe('handle()', function() {
    it('should revoke the previous token', function() {
      var token = { accessToken: 'foo', client: {}, user: {} };
      var model = {
        getRefreshToken: function() { return token; },
        saveToken: function() { return { accessToken: 'bar', client: {}, user: {} }; },
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} })
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: { refresh_token: 'bar' }, headers: {}, method: {}, query: {} });
      var client = {};

      return handler.handle(request, client)
        .then(function() {
          model.revokeToken.callCount.should.equal(1);
          model.revokeToken.firstCall.args.should.have.length(1);
          model.revokeToken.firstCall.args[0].should.equal(token);
          model.revokeToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('getRefreshToken()', function() {
    it('should call `model.getRefreshToken()`', function() {
      var model = {
        getRefreshToken: sinon.stub().returns({ accessToken: 'foo', client: {}, user: {} }),
        saveToken: function() {},
        revokeToken: function() {}
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: { refresh_token: 'bar' }, headers: {}, method: {}, query: {} });
      var client = {};

      return handler.getRefreshToken(request, client)
        .then(function() {
          model.getRefreshToken.callCount.should.equal(1);
          model.getRefreshToken.firstCall.args.should.have.length(1);
          model.getRefreshToken.firstCall.args[0].should.equal('bar');
          model.getRefreshToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('revokeToken()', function() {
    it('should call `model.revokeToken()`', function() {
      var model = {
        getRefreshToken: function() {},
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }),
        saveToken: function() {}
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      var token = {};

      return handler.revokeToken(token)
        .then(function() {
          model.revokeToken.callCount.should.equal(1);
          model.revokeToken.firstCall.args.should.have.length(1);
          model.revokeToken.firstCall.args[0].should.equal(token);
          model.revokeToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });

    it('should not call `model.revokeToken()`', function() {
      var model = {
        getRefreshToken: function() {},
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }),
        saveToken: function() {}
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: false });
      var token = {};

      return handler.revokeToken(token)
        .then(function() {
          model.revokeToken.callCount.should.equal(0);
        })
        .catch(should.fail);
    });

    it('should not call `model.revokeToken()`', function() {
      var model = {
        getRefreshToken: function() {},
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }),
        saveToken: function() {}
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: true });
      var token = {};

      return handler.revokeToken(token)
        .then(function() {
          model.revokeToken.callCount.should.equal(1);
          model.revokeToken.firstCall.args.should.have.length(1);
          model.revokeToken.firstCall.args[0].should.equal(token);
          model.revokeToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var client = {};
      var user = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });

      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'generateRefreshToken').returns('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz');

      return handler.saveToken(user, client, 'foobar')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', accessTokenExpiresAt: 'biz', refreshToken: 'bar', refreshTokenExpiresAt: 'baz', scope: 'foobar' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });

    it('should call `model.saveToken()` without refresh token', function() {
      var client = {};
      var user = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: false });

      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'generateRefreshToken').returns('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz');

      return handler.saveToken(user, client, 'foobar')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', accessTokenExpiresAt: 'biz', scope: 'foobar' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });

    it('should call `model.saveToken()` with refresh token', function() {
      var client = {};
      var user = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: true});

      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'generateRefreshToken').returns('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz');

      return handler.saveToken(user, client, 'foobar')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', accessTokenExpiresAt: 'biz', refreshToken: 'bar', refreshTokenExpiresAt: 'baz', scope: 'foobar' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
