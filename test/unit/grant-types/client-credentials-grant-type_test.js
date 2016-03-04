
/**
 * Module dependencies.
 */

var ClientCredentialsGrantType = require('../../../lib/grant-types/client-credentials-grant-type');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `ClientCredentialsGrantType`.
 */

describe('ClientCredentialsGrantType', function() {
  describe('getUserFromClient()', function() {
    it('should call `model.getUserFromClient()`', function() {
      var model = {
        getUserFromClient: sinon.stub().returns(true),
        saveToken: function() {}
      };
      var handler = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model, context: {b:123} });
      var client = {};

      return handler.getUserFromClient(client)
        .then(function() {
          model.getUserFromClient.callCount.should.equal(1);
          model.getUserFromClient.firstCall.args.should.have.length(2);
          model.getUserFromClient.firstCall.args[0].should.equal(client);
          model.getUserFromClient.firstCall.args[1].b.should.equal(123);
        })
        .catch(should.fail);
    });
  });

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var client = {};
      var user = {};
      var model = {
        getUserFromClient: function() {},
        saveToken: sinon.stub().returns(true)
      };
      var handler = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model, context: {b:456} });

      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');

      return handler.saveToken(user, client, 'foobar')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(4);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', accessTokenExpiresAt: 'biz', scope: 'foobar' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.args[3].b.should.equal(456);
        })
        .catch(should.fail);
    });
  });
});
