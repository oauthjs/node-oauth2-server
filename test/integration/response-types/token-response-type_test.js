'use strict';

/**
 * Module dependencies.
 */

var TokenResponseType = require('../../../lib/response-types/token-response-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var should = require('should');
var url = require('url');

/**
 * Test `TokenResponseType` integration.
 */

describe('TokenResponseType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `options.accessTokenLifetime` is missing', function() {
      try {
        new TokenResponseType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('should set `accessTokenLifetime`', function() {
      var responseType = new TokenResponseType({
        accessTokenLifetime: 120,
        model: {}
      });

      responseType.accessTokenLifetime.should.equal(120);
    });

    it('should set the `model`', function() {
      var model = {
        foobar: function() {}
      };
      var handler = new TokenResponseType({ accessTokenLifetime: 120, model: model });

      handler.model.should.equal(model);
    });
  });

  describe('buildRedirectUri()', function() {
    it('should throw an error if the `redirectUri` is missing', function() {
      var responseType = new TokenResponseType({
        accessTokenLifetime: 120,
        model: {}
      });

      try {
        responseType.buildRedirectUri();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `redirectUri`');
      }
    });

    it('should return the new redirect uri and set `access_token`, `token_type`, `expires_in` and `state` in the fragment', function() {
      var responseType = new TokenResponseType({
        accessTokenLifetime: 120,
        model: {}
      });

      responseType.accessToken = 'foobar-token';
      var redirectUri = responseType.buildRedirectUri(url.parse('http://example.com/cb'));

      url.format(redirectUri).should.equal('http://example.com/cb#access_token=foobar-token&token_type=access_token&expires_in=120');
    });

    it('should return the new redirect uri and append `access_token`, `token_type`, `expires_in` and `state` in the fragment', function() {
      var responseType = new TokenResponseType({
        accessTokenLifetime: 120,
        model: {}
      });

      responseType.accessToken = 'foobar-token';
      var redirectUri = responseType.buildRedirectUri(url.parse('http://example.com/cb?foo=bar', true));

      url.format(redirectUri).should.equal('http://example.com/cb?foo=bar#access_token=foobar-token&token_type=access_token&expires_in=120');
    });
  });
});
