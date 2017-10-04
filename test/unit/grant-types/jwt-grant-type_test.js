'use strict';

/**
 * Module dependencies.
 */

var JWTGrantType = require('../../../lib/grant-types/jwt-grant-type');
var Request = require('../../../lib/request');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `JWTGrantType`.
 */

describe('JWTGrantType', function() {
  describe('getToken()', function() {
    it('should call `model.getToken()`', function() {
      var requestData =  {body: { assertion:'testAssert' }, headers: {}, method: {}, query: {} };
      var model = {
        getUserFromToken: function() {},
        getToken: sinon.stub().returns(true),
        saveToken: function() {}
      };
      var handler = new JWTGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request(requestData);
      var clientData = {jwtPublicCert:"test"};
      return handler.getToken(request, clientData)
        .then(function() {
          model.getToken.callCount.should.equal(1);
          model.getToken.firstCall.args.should.have.length(2);
          model.getToken.firstCall.args[1].should.equal(clientData);
          model.getToken.firstCall.args[0].should.equal(request);
        })
        .catch(should.fail);
    });
  });

  describe('getUser()', function() {
    it('should call `model.getUserFromToken()`', function() {
      var requestData =  {body: { assertion:'testAssert' }, headers: {}, method: {}, query: {} };
      var model = {
        getUserFromToken: sinon.stub().returns(true),
        getToken: function() {},
        saveToken: function() {}
      };
      var handler = new JWTGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request(requestData);
      var clientData = {jwtPublicCert:"test"};
      var tokenData = {sub:'john@example.com'};

      return handler.getUser(request, clientData, tokenData)
        .then(function() {
          model.getUserFromToken.callCount.should.equal(1);
          model.getUserFromToken.firstCall.args.should.have.length(3);
          model.getUserFromToken.firstCall.args[0].should.equal(request);
          model.getUserFromToken.firstCall.args[1].should.equal(clientData);
          model.getUserFromToken.firstCall.args[2].should.equal(tokenData);
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
        getToken: function() {},
        getUserFromToken: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new JWTGrantType({ accessTokenLifetime: 120, model: model });

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
