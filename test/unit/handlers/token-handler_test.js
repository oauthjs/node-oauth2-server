'use strict';

/**
 * Module dependencies.
 */

var Request = require('../../../lib/request');
var Response = require('../../../lib/response');
var TokenHandler = require('../../../lib/handlers/token-handler');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', function() {
  describe('constructor()', function() {
    it('should allow null refreshTokenLifetime', function() {
      var model = {
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: function() {}
      };
      new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: null });

    });
    it('should allow null accessTokenLifetime', function() {
      var model = {
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: function() {}
      };
      new TokenHandler({ accessTokenLifetime: null, model: model, refreshTokenLifetime: 120 });

    });
  });

  describe('handle()', function() {
    it('should extend model object with request context', function() {
      var model = {
        getClient: sinon.stub().returns({ grants: ['client_credentials'] }),
        getUserFromClient: sinon.stub().returns({}),
        saveToken: sinon.stub().returns({
          accessToken: '123',
          client: {},
          user: {},
          accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          refreshTokenExpiresAt: new Date(new Date().getTime() + 10000)
        }),
      };

      var handler = new TokenHandler({
        accessTokenLifetime: 123,
        refreshTokenLifetime: 123,
        model: model,
      });

      var request = new Request({
        method: 'POST',
        body: { 'grant_type': 'client_credentials', 'client_id': 'abc', 'client_secret': 'xyz' },
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' },
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
          model.getClient.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
