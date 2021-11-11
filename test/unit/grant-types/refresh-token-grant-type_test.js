'use strict';

/**
 * Module dependencies.
 */

const RefreshTokenGrantType = require('../../../lib/grant-types/refresh-token-grant-type');
const Request = require('../../../lib/request');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `RefreshTokenGrantType`.
 */

describe('RefreshTokenGrantType', function() {
  describe('handle()', function() {
    it('should revoke the previous token', function() {
      const token = { accessToken: 'foo', client: {}, user: {} };
      const model = {
        getRefreshToken: function() { return token; },
        saveToken: function() { return { accessToken: 'bar', client: {}, user: {} }; },
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} })
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 'bar' }, headers: {}, method: {}, query: {} });
      const client = {};

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
      const model = {
        getRefreshToken: sinon.stub().returns({ accessToken: 'foo', client: {}, user: {} }),
        saveToken: function() {},
        revokeToken: function() {}
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const request = new Request({ body: { refresh_token: 'bar' }, headers: {}, method: {}, query: {} });
      const client = {};

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
      const model = {
        getRefreshToken: function() {},
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }),
        saveToken: function() {}
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });
      const token = {};

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
      const model = {
        getRefreshToken: function() {},
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }),
        saveToken: function() {}
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: false });
      const token = {};

      return handler.revokeToken(token)
        .then(function() {
          model.revokeToken.callCount.should.equal(0);
        })
        .catch(should.fail);
    });

    it('should not call `model.revokeToken()`', function() {
      const model = {
        getRefreshToken: function() {},
        revokeToken: sinon.stub().returns({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }),
        saveToken: function() {}
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: true });
      const token = {};

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
      const client = {};
      const user = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model });

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
      const client = {};
      const user = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: false });

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
      const client = {};
      const user = {};
      const model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new RefreshTokenGrantType({ accessTokenLifetime: 120, model: model, alwaysIssueNewRefreshToken: true});

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
