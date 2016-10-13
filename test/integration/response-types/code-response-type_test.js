'use strict';

/**
 * Module dependencies.
 */

var CodeResponseType = require('../../../lib/response-types/code-response-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var Promise = require('bluebird');
var should = require('should');
var sinon = require('sinon');
var url = require('url');

/**
 * Test `CodeResponseType` integration.
 */

describe('CodeResponseType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.authorizationCodeLifetime` is missing', function() {
      try {
        new CodeResponseType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `authorizationCodeLifetime`');
      }
    });

    it('should set the `code`', function() {
      var model = {
        saveAuthorizationCode: function() {}
      };
      var responseType = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      responseType.authorizationCodeLifetime.should.equal(120);
    });
  });

  it('should throw an error if the model does not implement `saveAuthorizationCode()`', function() {
    try {
      new CodeResponseType({ authorizationCodeLifetime: 120, model: { } });

      should.fail();
    } catch (e) {
      e.should.be.an.instanceOf(InvalidArgumentError);
      e.message.should.equal('Invalid argument: model does not implement `saveAuthorizationCode()`');
    }
  });

  it('should set the `authorizationCodeLifetime`', function() {
    var model = {
      saveAuthorizationCode: function() {}
    };
    var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

    handler.authorizationCodeLifetime.should.equal(120);
  });

  describe('buildRedirectUri()', function() {
    it('should throw an error if the `redirectUri` is missing', function() {
      var model = {
        saveAuthorizationCode: function() {}
      };
      var responseType = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      try {
        responseType.buildRedirectUri();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `redirectUri`');
      }
    });

    it('should return the new redirect uri and set the `code` and `state` in the query', function() {
      var model = {
        saveAuthorizationCode: function() {}
      };
      var responseType = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
      responseType.code = 'foo';
      var redirectUri = responseType.buildRedirectUri(url.parse('http://example.com/cb'));

      url.format(redirectUri).should.equal('http://example.com/cb?code=foo');
    });

    it('should return the new redirect uri and append the `code` and `state` in the query', function() {
      var model = {
        saveAuthorizationCode: function() {}
      };
      var responseType = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
      responseType.code = 'foo';
      var redirectUri = responseType.buildRedirectUri(url.parse('http://example.com/cb?foo=bar', true));

      url.format(redirectUri).should.equal('http://example.com/cb?foo=bar&code=foo');
    });
  });

  it('should set the `model`', function() {
    var model = {
      saveAuthorizationCode: function() {}
    };
    var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

    handler.model.should.equal(model);
  });

  describe('generateAuthorizationCode()', function() {
    it('should return an auth code', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      return handler.generateAuthorizationCode()
        .then(function(data) {
          data.should.be.a.sha1;
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var model = {
        generateAuthorizationCode: function() {
          return Promise.resolve({});
        },
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      handler.generateAuthorizationCode().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var model = {
        generateAuthorizationCode: function() {
          return {};
        },
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      handler.generateAuthorizationCode().should.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthorizationCodeExpiresAt()', function() {
    it('should return a date', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      handler.getAuthorizationCodeExpiresAt({}).should.be.an.instanceOf(Date);
    });
  });

  describe('saveAuthorizationCode()', function() {
    it('should return an auth code', function() {
      var authorizationCode = {};
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {
          return authorizationCode;
        }
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      return handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz')
        .then(function(data) {
          data.should.equal(authorizationCode);
        })
        .catch(should.fail);
    });

    it('should support promises when calling `model.saveAuthorizationCode()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {
          return Promise.resolve({});
        }
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises when calling `model.saveAuthorizationCode()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {
          return {};
        }
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz').should.be.an.instanceOf(Promise);
    });
  });

  describe('saveAuthorizationCode()', function() {
    it('should call `model.saveAuthorizationCode()`', function() {
      var model = {
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: sinon.stub().returns({})
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      return handler.saveAuthorizationCode('foo', 'bar', 'qux', 'biz', 'baz', 'boz')
        .then(function() {
          model.saveAuthorizationCode.callCount.should.equal(1);
          model.saveAuthorizationCode.firstCall.args.should.have.length(3);
          model.saveAuthorizationCode.firstCall.args[0].should.eql({ authorizationCode: 'foo', expiresAt: 'bar', redirectUri: 'baz', scope: 'qux' });
          model.saveAuthorizationCode.firstCall.args[1].should.equal('biz');
          model.saveAuthorizationCode.firstCall.args[2].should.equal('boz');
        })
        .catch(should.fail);
    });
  });

  describe('generateAuthorizationCode()', function() {
    it('should call `model.generateAuthorizationCode()`', function() {
      var model = {
        generateAuthorizationCode: sinon.stub().returns({}),
        getAccessToken: function() {},
        getClient: function() {},
        saveAuthorizationCode: function() {}
      };
      var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

      return handler.generateAuthorizationCode()
        .then(function() {
          model.generateAuthorizationCode.callCount.should.equal(1);
        })
        .catch(should.fail);
    });
  });
});
