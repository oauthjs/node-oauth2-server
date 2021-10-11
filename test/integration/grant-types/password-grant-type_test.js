'use strict';

/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var should = require('chai').should();

/**
 * Test `PasswordGrantType` integration.
 */

describe('PasswordGrantType integration', function() {
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
        new PasswordGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getUser()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        var model = {
          getUser: function() {}
        };

        new PasswordGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var model = {
        getUser: function() {},
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      var model = {
        getUser: function() {},
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      try {
        grantType.handle({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getUser: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'baz'; }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar', scope: 'baz' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getUser: function() { return {}; },
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getUser: function() { return {}; },
        saveToken: function() { return token; }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getUser: function(username, password, callback) { callback(null, {}); },
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getUser()', function() {
    it('should throw an error if the request body does not contain `username`', function() {
      var model = {
        getUser: function() {},
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `username`');
      }
    });

    it('should throw an error if the request body does not contain `password`', function() {
      var model = {
        getUser: function() {},
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `password`');
      }
    });

    it('should throw an error if `username` is invalid', function() {
      var model = {
        getUser: function() {},
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: '\r\n', password: 'foobar' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `username`');
      }
    });

    it('should throw an error if `password` is invalid', function() {
      var model = {
        getUser: function() {},
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foobar', password: '\r\n' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `password`');
      }
    });

    it('should throw an error if `user` is missing', function() {
      var model = {
        getUser: function() {},
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.getUser(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUser: function() { return user; },
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.getUser(request)
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUser: function() { return Promise.resolve(user); },
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUser: function() { return user; },
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUser: function(username, password, callback) { callback(null, user); },
        saveToken: function() {}
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      var token = {};
      var model = {
        getUser: function() {},
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = {};
      var model = {
        getUser: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        getUser: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var token = {};
      var model = {
        getUser: function() {},
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      var grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
