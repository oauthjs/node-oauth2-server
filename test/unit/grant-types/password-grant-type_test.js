'use strict';

/**
 * Module dependencies.
 */

var PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
var Request = require('../../../lib/request');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `PasswordGrantType`.
 */

describe('PasswordGrantType', function() {
  describe('getUser()', function() {
    it('should call `model.getUser()`', function() {
      var model = {
        getUser: sinon.stub().returns(true),
        saveToken: function() {}
      };
      var handler = new PasswordGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return handler.getUser(request)
        .then(function() {
          model.getUser.callCount.should.equal(1);
          model.getUser.firstCall.args.should.have.length(2);
          model.getUser.firstCall.args[0].should.equal('foo');
          model.getUser.firstCall.args[1].should.equal('bar');
          model.getUser.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var client = {};
      var user = {};
      var model = {
        getUser: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new PasswordGrantType({ accessTokenLifetime: 120, model: model });

      sinon.stub(handler, 'validateScope').returns('foobar');
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
