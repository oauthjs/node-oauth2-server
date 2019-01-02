'use strict';

/**
 * Module dependencies.
 */

var AuthorizeHandler = require('../../../lib/handlers/authorize-handler');
var Request = require('../../../lib/request');
var Response = require('../../../lib/response');
var Promise = require('bluebird');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `AuthorizeHandler`.
 */

describe('AuthorizeHandler', function() {
  describe('handle()', function() {
    it('should extend model object with request context', function() {
      var model = {
        getClient: sinon.stub().returns({
          grants: ['authorization_code'],
          redirectUris: ['/abc']
        }),
        saveAuthorizationCode: sinon.stub().returns({ authorizationCode: 'code_abc' })
      };
      var handler = new AuthorizeHandler({
        authenticateHandler: {
          handle: sinon.stub().returns({ name: 'xyz' })
        },
        authorizationCodeLifetime: 123,
        allowEmptyState: true,
        model: model
      });
      
      var request = new Request({
        body: { client_id: '123', response_type: 'code' },
        headers: {},
        method: {},
        query: {}
      });
      var response = new Response({});
      
      return handler.handle(request, response)
        .then(function() {
          model.request.should.equal(request);
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', function() {
    it('should call `model.getClient()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: sinon.stub().returns({ grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] }),
        saveAuthorizationCode: function() {}
      };
      var handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(function() {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(2);
          model.getClient.firstCall.args[0].should.equal(12345);
          model.getClient.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('getUser()', function() {
    it('should call `authenticateHandler.getUser()`', function() {
      var authenticateHandler = { handle: sinon.stub().returns(Promise.resolve({})) };
      var model = {
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      var handler = new AuthorizeHandler({ authenticateHandler: authenticateHandler, authorizationCodeLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });
      var response = new Response();

      return handler.getUser(request, response)
        .then(function() {
          authenticateHandler.handle.callCount.should.equal(1);
          authenticateHandler.handle.firstCall.args.should.have.length(2);
          authenticateHandler.handle.firstCall.args[0].should.equal(request);
          authenticateHandler.handle.firstCall.args[1].should.equal(response);
        })
        .catch(should.fail);
    });
  });
});
