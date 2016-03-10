'use strict';

/**
 * Module dependencies.
 */

var ClientCredentialsGrantType = require('../../../lib/grant-types/client-credentials-grant-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var should = require('should');

/**
 * Test `ClientCredentialsGrantType` integration.
 */

describe('ClientCredentialsGrantType integration', function() {
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
        new ClientCredentialsGrantType({ model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getUserFromClient()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        var model = {
          getUserFromClient: function() {}
        };

        new ClientCredentialsGrantType({ model: model });

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
        getUserFromClient: function() {},
        saveToken: function() {}
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });

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
        getUserFromClient: function() {},
        saveToken: function() {}
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', function() {
      var token = {};
      var model = {
        getUserFromClient: function() { return {}; },
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.handle(request, {})
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = {};
      var model = {
        getUserFromClient: function() { return {}; },
        saveToken: function() { return token; }
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        getUserFromClient: function() { return {}; },
        saveToken: function() { return token; }
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.handle(request, {}).should.be.an.instanceOf(Promise);
    });
  });

  describe('getUserFromClient()', function() {
    it('should throw an error if `user` is missing', function() {
      var model = {
        getUserFromClient: function() {},
        saveToken: function() {}
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.getUserFromClient(request, {})
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUserFromClient: function() { return user; },
        saveToken: function() {}
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      return grantType.getUserFromClient(request, {})
        .then(function(data) {
          data.should.equal(user);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUserFromClient: function() { return Promise.resolve(user); },
        saveToken: function() {}
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.getUserFromClient(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUserFromClient: function() {return user; },
        saveToken: function() {}
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.getUserFromClient(request, {}).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var user = { email: 'foo@bar.com' };
      var model = {
        getUserFromClient: function(userId, callback) { callback(null, user); },
        saveToken: function() {}
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 120, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      grantType.getUserFromClient(request, {}).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      var token = {};
      var model = {
        getUserFromClient: function() {},
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 123, model: model });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = {};
      var model = {
        getUserFromClient: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        getUserFromClient: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var token = {};
      var model = {
        getUserFromClient: function() {},
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      var grantType = new ClientCredentialsGrantType({ accessTokenLifetime: 123, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
