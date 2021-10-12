'use strict';

/**
 * Module dependencies.
 */

var BearerTokenType = require('../../../lib/token-types/bearer-token-type');
var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var should = require('chai').should();

/**
 * Test `BearerTokenType` integration.
 */

describe('BearerTokenType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `accessToken` is missing', function() {
      try {
        new BearerTokenType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessToken`');
      }
    });

    it('should set the `accessToken`', function() {
      var responseType = new BearerTokenType('foo', 'bar');

      responseType.accessToken.should.equal('foo');
    });

    it('should set the `accessTokenLifetime`', function() {
      var responseType = new BearerTokenType('foo', 'bar');

      responseType.accessTokenLifetime.should.equal('bar');
    });

    it('should set the `refreshToken`', function() {
      var responseType = new BearerTokenType('foo', 'bar', 'biz');

      responseType.refreshToken.should.equal('biz');
    });
  });

  describe('valueOf()', function() {
    it('should return the value representation', function() {
      var responseType = new BearerTokenType('foo', 'bar');
      var value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        token_type: 'Bearer'
      });
    });

    it('should not include the `expires_in` if not given', function() {
      var responseType = new BearerTokenType('foo');
      var value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        token_type: 'Bearer'
      });
    });

    it('should set `refresh_token` if `refreshToken` is defined', function() {
      var responseType = new BearerTokenType('foo', 'bar', 'biz');
      var value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer'
      });
    });

    it('should set `expires_in` if `accessTokenLifetime` is defined', function() {
      var responseType = new BearerTokenType('foo', 'bar', 'biz');
      var value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer'
      });
    });
  });
});
