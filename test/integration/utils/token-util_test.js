'use strict';

/**
 * Module dependencies.
 */

var TokenUtil = require('../../../lib/utils/token-util');
var should = require('should');

/**
 * Test `TokenUtil` integration.
 */

describe('TokenUtil integration', function() {
  describe('generateRandomToken()', function() {
    it('should return a sha-1 token', function() {
      return TokenUtil.generateRandomToken()
        .then(function(token) {
          token.should.be.a.sha1;
        })
        .catch(should.fail);
    });
  });
});
