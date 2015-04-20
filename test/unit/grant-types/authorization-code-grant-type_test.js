
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
  describe('getAuthCode()', function() {
    it('should call `model.getAuthCode()`', function() {
      var model = {
        getAuthCode: sinon.stub().returns({ authCode: 12345, client: {}, expiresAt: new Date(new Date() * 2), user: {} }),
        revokeAuthCode: function() {},
        saveToken: function() {}
      };
      var handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: { code: 12345 }, headers: {}, method: {}, query: {} });
      var client = {};

      return handler.getAuthCode(request, client)
        .then(function() {
          model.getAuthCode.callCount.should.equal(1);
          model.getAuthCode.firstCall.args.should.have.length(1);
          model.getAuthCode.firstCall.args[0].should.equal(12345);
        })
        .catch(should.fail);
    });
  });

  describe('revokeAuthCode()', function() {
    it('should call `model.revokeAuthCode()`', function() {
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: sinon.stub().returns({ authCode: 12345, client: {}, expiresAt: new Date(new Date() / 2), user: {} }),
        saveToken: function() {}
      };
      var handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });
      var authCode = {};

      return handler.revokeAuthCode(authCode)
        .then(function() {
          model.revokeAuthCode.callCount.should.equal(1);
          model.revokeAuthCode.firstCall.args.should.have.length(1);
          model.revokeAuthCode.firstCall.args[0].should.equal(authCode);
        })
        .catch(should.fail);
    });
  });

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var client = {};
      var user = {};
      var model = {
        getAuthCode: function() {},
        revokeAuthCode: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new AuthorizationCodeGrantType({ accessTokenLifetime: 120, model: model });

      sinon.stub(handler, 'generateAccessToken').returns(Promise.resolve('foo'));

      return handler.saveToken(user, client, 'foobar', 'foobiz')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', authCode: 'foobar', scope: 'foobiz' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
        })
        .catch(should.fail);
    });
  });
});
