'use strict';

/**
 * Module dependencies.
 */

const AuthenticateHandler = require('../../../lib/handlers/authenticate-handler');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const Request = require('../../../lib/request');
const sinon = require('sinon');
const should = require('chai').should();
const ServerError = require('../../../lib/errors/server-error');

/**
 * Test `AuthenticateHandler`.
 */

describe('AuthenticateHandler', function() {
  describe('getTokenFromRequest()', function() {
    describe('with bearer token in the request authorization header', function() {
      it('should throw an error if the token is malformed', () => {
        const handler = new AuthenticateHandler({
          model: { getAccessToken() {} },
        });
        const request = new Request({
          body: {},
          headers: {
            Authorization: 'foo Bearer bar',
          },
          method: 'ANY',
          query: {},
        });

        try {
          handler.getTokenFromRequestHeader(request);

          should.fail('should.fail', '');
        } catch (e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal(
            'Invalid request: malformed authorization header',
          );
        }
      });
    });

    describe('with bearer token in the request authorization header', function() {
      it('should call `getTokenFromRequestHeader()`', function() {
        const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
        const request = new Request({
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
        const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
        const request = new Request({
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
        const handler = new AuthenticateHandler({ model: { getAccessToken: function() {} } });
        const request = new Request({
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
      const model = {
        getAccessToken: sinon.stub().returns({ user: {} })
      };
      const handler = new AuthenticateHandler({ model: model });

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
      const model = {
        getAccessToken: function() {}
      };
      const handler = new AuthenticateHandler({ model: model });

      let failed = false;
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
      const model = {
        getAccessToken: function() {}
      };
      const handler = new AuthenticateHandler({ model: model });
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
      const model = {
        getAccessToken: function() {},
        verifyScope: sinon.stub().returns(true)
      };
      const handler = new AuthenticateHandler({ addAcceptedScopesHeader: true, addAuthorizedScopesHeader: true, model: model, scope: 'bar' });

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
