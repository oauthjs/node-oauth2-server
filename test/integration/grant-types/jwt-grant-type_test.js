'use strict';

/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var JWTGrantType = require('../../../lib/grant-types/jwt-grant-type');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var should = require('should');

/**
 * Test `JWTGrantType` integration.
 */

describe('JWTGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new JWTGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getToken()`', function() {
      try {
        var model = {
          getUserFromToken: function() {},
          saveToken: function() {}
        };

        new JWTGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getToken()`');
      }
    });

    it('should throw an error if the model does not implement `getUserFromToken()`', function() {
      try {
        var model = {
          getToken: function() {},
          saveToken: function() {}
        };

        new JWTGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getUserFromToken()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        var model = {
          getUserFromToken: function() {},
          getToken: function() {}
        };

        new JWTGrantType({ accessTokenLifetime: 123, model: model });

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
        getUserFromToken: function() {},
        getToken: function() {},
        saveToken: function() {}
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });

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
        getUserFromToken: function() {},
        getToken: function() {},
        saveToken: function() {}
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });

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
        getToken: function() {return {}; },
        getUserFromToken: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'baz'; }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });
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
        getToken: function() {return {}; },
        getUserFromToken: function() { return {}; },
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { assertion: 'test' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getToken: function() {return {}; },
        getUserFromToken: function() { return {}; },
        saveToken: function() { return token; }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { assertion: 'test' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var client = { id: 'foobar' };
      var token = {};
      var model = {
        getToken: function(request, client, callback) { callback(null, {}); },
        getUserFromToken: function(request, client, tokenData, callback) { callback(null, {}); },
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });
      var request = new Request({ body: { username: 'foo', password: 'bar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      var token = {};
      var model = {
        getUserFromToken: function() { return {}; },
        getToken: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = {};
      var model = {
        getUserFromToken: function() {},
        getToken: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        getUserFromToken: function() {},
        getToken: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var token = {};
      var model = {
        getUserFromToken: function() {},
        getToken: function() {},
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      var grantType = new JWTGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
