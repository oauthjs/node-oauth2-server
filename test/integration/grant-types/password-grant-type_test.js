
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var ServerError = require('../../../lib/errors/server-error');
var sinon = require('sinon');
var should = require('should');

/**
 * Test `PasswordGrantType`.
 */

describe('PasswordGrantType', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new PasswordGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getUser()`', function() {
      try {
        new PasswordGrantType({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: model does not implement `getUser()`');
      }
    });

    it('should set the `model`', function() {
      var model = { getUser: function() {} };
      var grantType = new PasswordGrantType(model);

      grantType.model.should.equal(model);
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var grantType = new PasswordGrantType({ getUser: function() {} });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if the request body does not contain `username`', function() {
      var grantType = new PasswordGrantType({ getUser: function() {} });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.handle(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `username`');
        });
    });

    it('should throw an error if the request body does not contain `password`', function() {
      var grantType = new PasswordGrantType({ getUser: function() {} });
      var request = new Request({ body: { username: 'foo' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `password`');
        });
    });

    it('should throw an error if `username` is invalid', function() {
      var grantType = new PasswordGrantType({ getUser: function() {} });
      var request = new Request({ body: { username: 'øå€£‰', password: 'foobar' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `username`');
        });
    });

    it('should throw an error if `password` is invalid', function() {
      var grantType = new PasswordGrantType({ getUser: function() {} });
      var request = new Request({ body: { username: 'foobar', password: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `password`');
        });
    });

    it('should throw an error if `user` is missing', function() {
      var model = {
        getUser: function() {
          return Promise.resolve();
        }
      };
      var grantType = new PasswordGrantType(model);
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUser: sinon.stub().returns(user)
      };
      var grantType = new PasswordGrantType(model);
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request)
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });

    it('should support promises when calling `model.getUser()`', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUser: function() {
          return Promise.resolve(user);
        }
      };
      var grantType = new PasswordGrantType(model);
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises when calling `model.getUser()`', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUser: function() {
          return user;
        }
      };
      var grantType = new PasswordGrantType(model);
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request).should.be.an.instanceOf(Promise);
    });
  });
});
