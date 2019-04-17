'use strict';

/**
 * Module dependencies.
 */

var ImplicitGrantType = require('../../../lib/grant-types/implicit-grant-type');
var Promise = require('bluebird');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `ImplicitGrantType`.
 */

describe('ImplicitGrantType', function() {
  describe('saveToken()', function() {
    it('should call `model.saveToken()`', function() {
      var client = {};
      var user = {};
      var model = {
        saveToken: sinon.stub().returns(true)
      };
      var handler = new ImplicitGrantType({
        accessTokenLifetime: 120,
        model: model,
        user: user
      });

      sinon.stub(handler, 'validateScope').returns('foobar');
      sinon.stub(handler, 'generateAccessToken').returns(Promise.resolve('foobar-token'));
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns(Promise.resolve('foo-1234'));

      return handler.saveToken(user, client, 'foobar')
        .then(function() {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({
            accessToken: 'foobar-token',
            accessTokenExpiresAt: 'foo-1234',
            scope: 'foobar'
          });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
