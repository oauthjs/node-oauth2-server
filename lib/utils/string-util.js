'use strict';

/**
 * Export `StringUtil`.
 */

module.exports = {
  base64URLEncode: function(str) {
    return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
};