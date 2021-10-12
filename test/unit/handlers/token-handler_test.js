'use strict';

/**
 * Module dependencies.
 */

var Request = require('../../../lib/request');
var TokenHandler = require('../../../lib/handlers/token-handler');
var sinon = require('sinon');
var should = require('chai').should();

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', function() {
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
