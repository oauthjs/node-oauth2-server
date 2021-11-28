'use strict';

/**
 * Module dependencies.
 */

const TokenUtil = require('../../../lib/utils/token-util');
const should = require('chai').should();

/**
 * Test `TokenUtil` integration.
 */

describe('TokenUtil integration', function() {
  describe('generateRandomToken()', function() {
    it('should return a sha-256 token', function() {
      return TokenUtil.generateRandomToken()
        .then(function(token) {
          token.should.be.a.sha256();
        })
        .catch(should.fail);
    });
  });
});
