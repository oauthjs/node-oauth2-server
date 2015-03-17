
/**
 * Module dependencies.
 */

var ClientCredentialsGrantType = require('../../../lib/grant-types/client-credentials-grant-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var ServerError = require('../../../lib/errors/server-error');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `ClientCredentialsGrantType`.
 */

describe('ClientCredentialsGrantType', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new ClientCredentialsGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getUserFromClient()`', function() {
      try {
        new ClientCredentialsGrantType({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: model does not implement `getUserFromClient()`');
      }
    });

    it('should set the `model`', function() {
      var model = {
        getUserFromClient: function() {}
      };
      var grantType = new ClientCredentialsGrantType(model);

      grantType.model.should.equal(model);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var grantType = new ClientCredentialsGrantType({ getUserFromClient: function() {} });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      var grantType = new ClientCredentialsGrantType({ getUserFromClient: function() {} });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should throw an error if `user` is missing', function() {
      var model = {
        getUserFromClient: function() {}
      };
      var grantType = new ClientCredentialsGrantType(model);
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.handle(request, {})
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUserFromClient: sinon.stub().returns(user)
      };
      var grantType = new ClientCredentialsGrantType(model);
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.handle(request, {})
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });

    it('should support promises when calling `model.getUserFromClient()`', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUserFromClient: function() {
          return Promise.resolve(user);
        }
      };
      var grantType = new ClientCredentialsGrantType(model);
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises when calling `model.getUserFromClient()`', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUserFromClient: function() {
          return user;
        }
      };
      var grantType = new ClientCredentialsGrantType(model);
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });
  });
});
