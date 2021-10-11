'use strict';

/**
 * Module dependencies.
 */

var AuthenticateHandler = require('../../../lib/handlers/authenticate-handler');
var Request = require('../../../lib/request');
var sinon = require('sinon');
var should = require('chai').should();
var ServerError = require('../../../lib/errors/server-error');

/**
 * Test `AuthenticateHandler`.
 */

describe('AuthenticateHandler', function() {
  describe('getTokenFromRequest()', function() {
    describe('with bearer token in the request authorization header', function() {
      it('should call `getTokenFromRequestHeader()`', function() {
        var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
        var request = new Request({
          body: {},
          headers: { 'Authorization': 'Bearer foo' },
          method: {},
          query: {}
        });

        sinon.stub(handler, 'getTokenFromRequestHeader');

        handler.getTokenFromRequest(request);

        handler.getTokenFromRequestHeader.callCount.should.equal(1);
        handler.getTokenFromRequestHeader.firstCall.args[0].should.equal(request);
        handler.getTokenFromRequestHeader.restore();
      });
    });

    describe('with bearer token in the request query', function() {
      it('should call `getTokenFromRequestQuery()`', function() {
        var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
        var request = new Request({
          body: {},
          headers: {},
          method: {},
          query: { access_token: 'foo' }
        });

        sinon.stub(handler, 'getTokenFromRequestQuery');

        handler.getTokenFromRequest(request);

        handler.getTokenFromRequestQuery.callCount.should.equal(1);
        handler.getTokenFromRequestQuery.firstCall.args[0].should.equal(request);
        handler.getTokenFromRequestQuery.restore();
      });
    });

    describe('with bearer token in the request body', function() {
      it('should call `getTokenFromRequestBody()`', function() {
        var handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
        var request = new Request({
          body: { access_token: 'foo' },
          headers: {},
          method: {},
          query: {}
        });

        sinon.stub(handler, 'getTokenFromRequestBody');

        handler.getTokenFromRequest(request);

        handler.getTokenFromRequestBody.callCount.should.equal(1);
        handler.getTokenFromRequestBody.firstCall.args[0].should.equal(request);
        handler.getTokenFromRequestBody.restore();
      });
    });
  });

  describe('getAccessToken()', function() {
    it('should call `model.getAccessToken()`', function() {
      var model = {
        getAccessToken: sinon.stub().returns({ user: {} })
      };
      var handler = new AuthenticateHandler({ model: model });

      return handler.getAccessToken('foo')
        .then(function() {
          model.getAccessToken.callCount.should.equal(1);
          model.getAccessToken.firstCall.args.should.have.length(1);
          model.getAccessToken.firstCall.args[0].should.equal('foo');
          model.getAccessToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('validateAccessToken()', function() {
    it('should fail if token has no valid `accessTokenExpiresAt` date', function() {
      var model = {
        getAccessToken: function() {}
      };
      var handler = new AuthenticateHandler({ model: model });

      var failed = false;
      try {
        handler.validateAccessToken({
          user: {}
        });
      }
      catch (err) {
        err.should.be.an.instanceOf(ServerError);
        failed = true;
      }
      failed.should.equal(true);
    });

    it('should succeed if token has valid `accessTokenExpiresAt` date', function() {
      var model = {
        getAccessToken: function() {}
      };
      var handler = new AuthenticateHandler({ model: model });
      try {
        handler.validateAccessToken({
          user: {},
          accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
        });
      }
      catch (err) {
        should.fail();
      }
    });
  });

  describe('verifyScope()', function() {
    it('should call `model.getAccessToken()` if scope is defined', function() {
      var model = {
        getAccessToken: function() {},
        verifyScope: sinon.stub().returns(true)
      };
      var handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'bar' });

      return handler.verifyScope('foo')
        .then(function() {
          model.verifyScope.callCount.should.equal(1);
          model.verifyScope.firstCall.args.should.have.length(2);
          model.verifyScope.firstCall.args[0].should.equal('foo', 'bar');
          model.verifyScope.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
