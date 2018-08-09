'use strict';

/**
 * Module dependencies.
 */

var ImplicitGrantType = require('../../../lib/grant-types/implicit-grant-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var Promise = require('bluebird');
var Request = require('../../../lib/request');
var should = require('should');

/**
 * Test `ImplicitGrantType` integration.
 */

describe('ImplicitGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new ImplicitGrantType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        var model = {};

        new ImplicitGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });

    it('should throw an error if the `user` parameter is missing', function() {
      try {
        var model = {
          saveToken: function() {}        
        };

        new ImplicitGrantType({ model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `user`');
      }
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var model = {
        saveToken: function() {}
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });

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
        saveToken: function() {}
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });
      var request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        grantType.handle(request, null);
      }
      catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', function() {
      var client = { id: 'foobar' };
      var token = { accessToken: 'foobar-token' };
      var model = {
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });
      var request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var client = { id: 'foobar' };
      var model = {
        saveToken: function() {}
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });
      var request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var client = { id: 'foobar' };
      var model = {
        saveToken: function() {}
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });
      var request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var client = { id: 'foobar' };
      var model = {
        saveToken: function(tokenToSave, client, user, callback) { callback(null, tokenToSave); }
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });
      var request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
      grantType.handle(request, client).then(function(data) {
        data.should.have.keys('accessToken', 'accessTokenExpiresAt');
        data.accessToken.should.be.type('string');
      });
      
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      var token = {};
      var model = {
        saveToken: function() { return token; },
        validateScope: function() { return 'foo'; }
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = {};
      var model = {
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        saveToken: function() { return token; }
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function() {
      var token = {};
      var model = {
        saveToken: function(tokenToSave, client, user, callback) { callback(null, token); }
      };
      var grantType = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model: model,
        user: {}
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
