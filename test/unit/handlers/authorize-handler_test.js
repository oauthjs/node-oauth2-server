'use strict';

/**
 * Module dependencies.
 */

const AuthorizeHandler = require('../../../lib/handlers/authorize-handler');
const Request = require('../../../lib/request');
const Response = require('../../../lib/response');
const Promise = require('bluebird');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `AuthorizeHandler`.
 */

describe('AuthorizeHandler', function() {
  describe('generateAuthorizationCode()', function() {
    it('should call `model.generateAuthorizationCode()`', function() {
      const model = {
        generateAuthorizationCode: sinon.stub().returns({}),
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model: model });

      return handler.generateAuthorizationCode()
        .then(function() {
          model.generateAuthorizationCode.callCount.should.equal(1);
          model.generateAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', function() {
    it('should call `model.getClient()`', function() {
      const model = {
        getAccessToken: function() {},
        getClient: sinon.stub().returns({ grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] }),
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model: model });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

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
      const authenticateHandler = { handle: sinon.stub().returns(Promise.resolve({})) };
      const model = {
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      const handler = new AuthorizeHandler({ authenticateHandler: authenticateHandler, authorizationCodeLifetime: 120, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });
      const response = new Response();

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

  describe('saveAuthorizationCode()', function() {
    it('should call `model.saveAuthorizationCode()`', function() {
      const model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: sinon.stub().returns({})
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model: model });

      return handler.saveAuthorizationCode('foo', 'bar', 'qux', 'biz', 'baz', 'boz')
        .then(function() {
          model.saveAuthorizationCode.callCount.should.equal(1);
          model.saveAuthorizationCode.firstCall.args.should.have.length(3);
          model.saveAuthorizationCode.firstCall.args[0].should.eql({ authorizationCode: 'foo', expiresAt: 'bar', redirectUri: 'baz', scope: 'qux' });
          model.saveAuthorizationCode.firstCall.args[1].should.equal('biz');
          model.saveAuthorizationCode.firstCall.args[2].should.equal('boz');
          model.saveAuthorizationCode.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('validateRedirectUri()', function() {
    it('should call `model.validateRedirectUri()`', function() {
      const client = { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
      const redirect_uri = 'http://example.com/cb/2';
      const model = {
        getAccessToken: function() {},
        getClient: sinon.stub().returns(client),
        saveAuthorizationCode: function() {},
        validateRedirectUri: sinon.stub().returns(true)
      };
      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model: model });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret', redirect_uri }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(function() {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(2);
          model.getClient.firstCall.args[0].should.equal(12345);
          model.getClient.firstCall.thisValue.should.equal(model);

          model.validateRedirectUri.callCount.should.equal(1);
          model.validateRedirectUri.firstCall.args.should.have.length(2);
          model.validateRedirectUri.firstCall.args[0].should.equal(redirect_uri);
          model.validateRedirectUri.firstCall.args[1].should.equal(client);
          model.validateRedirectUri.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });

    it('should be successful validation', function () {
      const client = { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
      const redirect_uri = 'http://example.com/cb';
      const model = {
        getAccessToken: function() {},
        getClient: sinon.stub().returns(client),
        saveAuthorizationCode: function() {},
        validateRedirectUri: function (redirectUri, client) {
          return client.redirectUris.includes(redirectUri);
        }
      };

      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model: model });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret', redirect_uri }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then((client) => {
          client.should.equal(client);
        });
    });

    it('should be unsuccessful validation', function () {
      const client = { grants: ['authorization_code'], redirectUris: ['http://example.com/cb'] };
      const redirect_uri = 'http://example.com/callback';
      const model = {
        getAccessToken: function() {},
        getClient: sinon.stub().returns(client),
        saveAuthorizationCode: function() {},
        validateRedirectUri: function (redirectUri, client) {
          return client.redirectUris.includes(redirectUri);
        }
      };

      const handler = new AuthorizeHandler({ authorizationCodeLifetime: 120, model: model });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret', redirect_uri }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(() => {
          throw Error('should not resolve');
        })
        .catch((err) => {
          err.name.should.equal('invalid_client');
          err.message.should.equal('Invalid client: `redirect_uri` does not match client value');
        });
    });
  });
});
