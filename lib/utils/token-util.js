'use strict';

/**
 * Module dependencies.
 */

const crypto = require('crypto');
const randomBytes = require('bluebird').promisify(require('crypto').randomBytes);

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
        .createHash('sha256')
        .update(buffer)
        .digest('hex');
    });
  }

};
