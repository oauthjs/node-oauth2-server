'use strict';

/**
 * Module dependencies.
 */

var crypto = require('crypto');
var randomBytes = require('bluebird').promisify(require('crypto').randomBytes);

/**
 * Export `TokenUtil`.
 */

module.exports = {

  /**
   * Generate random token.
   */

  generateRandomToken: function() {
    return randomBytes(256).then(function(buffer) {
      return crypto
        .createHash('sha1')
        .update(buffer)
        .digest('hex');
    });
  }

};
