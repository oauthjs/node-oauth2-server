
/**
 * Module dependencies.
 */

var AuthorizeHandler = require('../../../lib/handlers/authorize-handler');
var Request = require('../../../lib/request');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `AuthorizeHandler`.
 */

describe('AuthorizeHandler', function() {
  describe('generateAuthCode()', function() {
    it('should call `model.generateAuthCode()`', function() {
      var model = {
        generateAuthCode: sinon.stub().returns({}),
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      return handler.generateAuthCode()
        .then(function() {
          model.generateAuthCode.callCount.should.equal(1);
          model.generateAuthCode.firstCall.args.should.have.length(0);
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', function() {
    it('should call `model.getClient()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: sinon.stub().returns({ grants: ['authorization_code'], redirectUri: 'http://example.com/cb' }),
        saveAuthCode: function() {}
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });
      var request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

      return handler.getClient(request)
        .then(function() {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(1);
          model.getClient.firstCall.args[0].should.equal(12345);
        })
        .catch(should.fail);
    });
  });

  describe('saveAuthCode()', function() {
    it('should call `model.saveAuthCode()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthCode: sinon.stub().returns({})
      };
      var handler = new AuthorizeHandler({ authCodeLifetime: 120, model: model });

      return handler.saveAuthCode('foo', 'bar', 'qux', 'biz', 'baz')
        .then(function() {
          model.saveAuthCode.callCount.should.equal(1);
          model.saveAuthCode.firstCall.args.should.have.length(3);
          model.saveAuthCode.firstCall.args[0].should.eql({ authCode: 'foo', expiresOn: 'bar', scope: 'qux' });
          model.saveAuthCode.firstCall.args[1].should.equal('biz');
          model.saveAuthCode.firstCall.args[2].should.equal('baz');
        })
        .catch(should.fail);
    });
  });
});
