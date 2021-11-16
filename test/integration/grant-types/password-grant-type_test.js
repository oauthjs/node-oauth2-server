'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
const InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
const InvalidRequestError = require('../../../lib/errors/invalid-request-error');
const PasswordGrantType = require('../../../lib/grant-types/password-grant-type');
const Promise = require('bluebird');
const Request = require('../../../lib/request');
const should = require('chai').should();

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
        const model = {
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
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      try {
        grantType.handle({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', function() {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'baz'; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar', scope: 'baz' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: function() { return {}; },
        saveToken: function() { return Promise.resolve(token); }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: function() { return {}; },
        saveToken: function() { return token; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: function(username, password, callback) { callback(null, {}); },
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getUser()', function() {
    it('should throw an error if the request body does not contain `username`', function() {
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `username`');
      }
    });

    it('should throw an error if the request body does not contain `password`', function() {
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `password`');
      }
    });

    it('should throw an error if `username` is invalid', function() {
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: '\r\n', password: 'foobar' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `username`');
      }
    });

    it('should throw an error if `password` is invalid', function() {
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foobar', password: '\r\n' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getUser(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `password`');
      }
    });

    it('should throw an error if `user` is missing', function() {
      const model = {
        getUser: function() {},
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.getUser(request)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: function() { return user; },
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      return grantType.getUser(request)
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: function() { return Promise.resolve(user); },
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: function() { return user; },
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser: function(username, password, callback) { callback(null, user); },
        saveToken: function() {}
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });
      const request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      const token = {};
      const model = {
        getUser: function() {},
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      const token = {};
      const model = {
        getUser: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      const token = {};
      const model = {
        getUser: function() {},
        saveToken: function() { return token; }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      const token = {};
      const model = {
        getUser: function() {},
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      const grantType = new PasswordGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
