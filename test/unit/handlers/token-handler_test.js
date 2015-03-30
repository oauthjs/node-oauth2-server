
/**
 * Module dependencies.
 */

var Request = require('../../../lib/request');
var TokenHandler = require('../../../lib/handlers/token-handler');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', function() {
  describe('generateAccessToken()', function() {
    it('should call `model.generateAccessToken()`', function() {
      var model = {
        generateAccessToken: sinon.spy(),
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.generateAccessToken()
        .then(function() {
          model.generateAccessToken.callCount.should.equal(1);
          model.generateAccessToken.firstCall.args.should.have.length(0);
        })
        .catch(should.fail);
    });
  });

  describe('generateRefreshToken()', function() {
    it('should call `model.generateRefreshToken()`', function() {
      var client = {
        grants: ['refresh_token']
      };
      var model = {
        generateRefreshToken: sinon.spy(),
        getClient: function() {},
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.generateRefreshToken(client)
        .then(function() {
          model.generateRefreshToken.callCount.should.equal(1);
          model.generateRefreshToken.firstCall.args.should.have.length(0);
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', function() {
    it('should call `model.getClient()`', function() {
      var model = {
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: function() {}
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
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

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var model = {
        getClient: function() {},
        saveToken: sinon.stub().returns({})
      };
      var handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });

      return handler.saveToken('foo', 'bar', 'biz', 'baz', 'fiz', 'qux', 'fuz')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', accessTokenExpiresOn: 'biz', refreshToken: 'bar', refreshTokenExpiresOn: 'baz', scope: 'fiz' });
          model.saveToken.firstCall.args[1].should.equal('qux');
          model.saveToken.firstCall.args[2].should.equal('fuz');
        })
        .catch(should.fail);
    });
  });
});
