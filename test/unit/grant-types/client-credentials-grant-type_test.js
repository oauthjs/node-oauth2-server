'use strict';

/**
 * Module dependencies.
 */

const ClientCredentialsGrantType = require('../../../lib/grant-types/client-credentials-grant-type');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `ClientCredentialsGrantType`.
 */

describe('ClientCredentialsGrantType', function() {
  describe('getUserFromClient()', function() {
    it('should call `model.getUserFromClient()`', function() {
      const model = {
        getUserFromClient: sinon.stub().returns(true),
        saveToken: function() {}
      };
      const handler = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      const client = {};

      return handler.getUserFromClient(client)
        .then(function() {
          model.getUserFromClient.callCount.should.equal(1);
          model.getUserFromClient.firstCall.args.should.have.length(1);
          model.getUserFromClient.firstCall.args[0].should.equal(client);
          model.getUserFromClient.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });

  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      const client = {};
      const user = {};
      const model = {
        getUserFromClient: function() {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });

      sinon.stub(handler, 'validateScope').returns('foobar');
      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');

      return handler.saveToken(user, client, 'foobar')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({ accessToken: 'foo', accessTokenExpiresAt: 'biz', scope: 'foobar' });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
