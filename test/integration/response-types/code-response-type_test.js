'use strict';

/**
 * Module dependencies.
 */

var CodeResponseType = require('../../../lib/response-types/code-response-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var Request = require('../../../lib/request');
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
          data.should.be.a.sha1();
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

    describe('with PKCE', function() {
      it('should save codeChallenge and codeChallengeMethod', function() {
        var model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: sinon.stub().returns({})
        };
        var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

        return handler.saveAuthorizationCode('foo', new Date(12345), 'qux', { id: 'biz' }, 'baz', { id: 'boz' }, 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', 'S256')
          .then(function() {
            model.saveAuthorizationCode.callCount.should.equal(1);
            model.saveAuthorizationCode.firstCall.args.should.have.length(3);
            model.saveAuthorizationCode.firstCall.args[0].should.eql({ authorizationCode: 'foo', expiresAt: new Date(12345), redirectUri: 'baz', scope: 'qux', codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', codeChallengeMethod: 'S256' });
            model.saveAuthorizationCode.firstCall.args[1].id.should.equal('biz');
            model.saveAuthorizationCode.firstCall.args[2].id.should.equal('boz');
          })
          .catch(should.fail);
      });

      it('should save codeChallenge and set codeChallengeMethod to `plain` when codeChallengeMethod is not present', function() {
        var model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: sinon.stub().returns({})
        };
        var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

        return handler.saveAuthorizationCode('foo', new Date(12345), 'qux', { id: 'biz' }, 'baz', { id: 'boz' }, 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', null)
          .then(function() {
            model.saveAuthorizationCode.callCount.should.equal(1);
            model.saveAuthorizationCode.firstCall.args.should.have.length(3);
            model.saveAuthorizationCode.firstCall.args[0].should.eql({ authorizationCode: 'foo', expiresAt: new Date(12345), redirectUri: 'baz', scope: 'qux', codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', codeChallengeMethod: 'plain' });
            model.saveAuthorizationCode.firstCall.args[1].id.should.equal('biz');
            model.saveAuthorizationCode.firstCall.args[2].id.should.equal('boz');
          })
          .catch(should.fail);
      });

      it('should save code but not save codeChallenge or codeChallengeMethod when codeChallenge is not present and codeChallengeMethod is present', function() {
        var model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: sinon.stub().returns({})
        };
        var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });

        return handler.saveAuthorizationCode('foo', new Date(12345), 'qux', { id: 'biz' }, 'baz', { id: 'boz' }, '', 'S256')
          .then(function() {
            model.saveAuthorizationCode.callCount.should.equal(1);
            model.saveAuthorizationCode.firstCall.args.should.have.length(3);
            model.saveAuthorizationCode.firstCall.args[0].should.eql({ authorizationCode: 'foo', expiresAt: new Date(12345), redirectUri: 'baz', scope: 'qux' });
            model.saveAuthorizationCode.firstCall.args[1].id.should.equal('biz');
            model.saveAuthorizationCode.firstCall.args[2].id.should.equal('boz');
          })
          .catch(should.fail);
      });
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

  describe('with PKCE', function() { 
    describe('getCodeChallenge()', function() {
      describe('with invalid `code_challenge`', function() {
        it('should throw an error if code_challenge is too short', function() {
          var model = {
            getAccessToken: function() {},
            getClient: function() {},
            saveAuthorizationCode: function() {}
          };
          var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
          var request = new Request({ body: { code_challenge: 'foo' }, headers: {}, method: {}, query: {} });

          try {
            handler.getCodeChallenge(request);
            should.fail();
          } catch (e) {
            e.should.be.an.instanceOf(InvalidRequestError);
            e.message.should.equal('Invalid parameter: `code_challenge`');
          }
        });

        it('should throw an error if code_challenge is too long', function() {
          var model = {
            getAccessToken: function() {},
            getClient: function() {},
            saveAuthorizationCode: function() {}
          };
          var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
          var request = new Request({ body: { code_challenge: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890' }, headers: {}, method: {}, query: {} });

          try {
            handler.getCodeChallenge(request);
            should.fail();
          } catch (e) {
            e.should.be.an.instanceOf(InvalidRequestError);
            e.message.should.equal('Invalid parameter: `code_challenge`');
          }
        });

        it('should throw an error if code_challenge has invalid characters', function() {
          var model = {
            getAccessToken: function() {},
            getClient: function() {},
            saveAuthorizationCode: function() {}
          };
          var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
          var request = new Request({ body: { code_challenge: 'E9M!!!!!oa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM' }, headers: {}, method: {}, query: {} });

          try {
            handler.getCodeChallenge(request);
            should.fail();
          } catch (e) {
            e.should.be.an.instanceOf(InvalidRequestError);
            e.message.should.equal('Invalid parameter: `code_challenge`');
          }
        });
      });
      
      describe('with `code_challenge` in the request body', function() {
        it('should return the code_challenge', function() {
          var model = {
            getAccessToken: function() {},
            getClient: function() {},
            saveAuthorizationCode: function() {}
          };
          var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
          var request = new Request({ body: { code_challenge: '_-~.E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM' }, headers: {}, method: {}, query: {} });

          handler.getCodeChallenge(request).should.equal('_-~.E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
        });
      });

      describe('with `code_challenge` in the request query', function() {
        it('should return the code_challenge', function() {
          var model = {
            getAccessToken: function() {},
            getClient: function() {},
            saveAuthorizationCode: function() {}
          };
          var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
          var request = new Request({ body: {}, headers: {}, method: {}, query: { code_challenge: '_-~.E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM' } });

          handler.getCodeChallenge(request).should.equal('_-~.E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
        });
      });
    });

    describe('getCodeChallengeMethod()', function() {
      it('should throw an error if `code_challenge_method` is invalid', function() {
        var model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
        var request = new Request({ body: { code_challenge_method: 'foo' }, headers: {}, method: {}, query: {} });

        try {
          handler.getCodeChallengeMethod(request);
          should.fail();
        } catch (e) {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid parameter: `code_challenge_method`');
        }
      });

      it('should return null if `code_challenge_method` is not provided', function() {
        var model = {
          getAccessToken: function() {},
          getClient: function() {},
          saveAuthorizationCode: function() {}
        };
        var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
        var request = new Request({ body: { }, headers: {}, method: {}, query: {} });

        (handler.getCodeChallengeMethod(request) === null).should.equal(true);
      });

      describe('with `code_challenge_method` in the request body', function() {
        it('should return the code_challenge_method', function() {
          var model = {
            getAccessToken: function() {},
            getClient: function() {},
            saveAuthorizationCode: function() {}
          };
          var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
          var request = new Request({ body: { code_challenge_method: 'plain' }, headers: {}, method: {}, query: {} });

          handler.getCodeChallengeMethod(request).should.equal('plain');
        });
      });

      describe('with `code_challenge_method` in the request query', function() {
        it('should return the code_challenge_method', function() {
          var model = {
            getAccessToken: function() {},
            getClient: function() {},
            saveAuthorizationCode: function() {}
          };
          var handler = new CodeResponseType({ authorizationCodeLifetime: 120, model: model });
          var request = new Request({ body: {}, headers: {}, method: {}, query: { code_challenge_method: 'S256' } });

          handler.getCodeChallengeMethod(request).should.equal('S256');
        });
      });
    });
  });
});
