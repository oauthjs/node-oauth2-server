'use strict';

/**
 * Module dependencies.
 */

const Request = require('../../../lib/request');
const TokenHandler = require('../../../lib/handlers/token-handler');
const sinon = require('sinon');
const should = require('chai').should();

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', function() {
  describe('getClient()', function() {
    it('should call `model.getClient()`', function() {
      const model = {
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: function() {}
      };
      const handler = new TokenHandler({ accessTokenLifetime: 120, model: model, refreshTokenLifetime: 120 });
      const request = new Request({ body: { client_id: 12345, client_secret: 'secret' }, headers: {}, method: {}, query: {} });

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
