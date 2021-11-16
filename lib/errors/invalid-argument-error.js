'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');
const util = require('util');

/**
 * Constructor.
 */

function InvalidArgumentError(message, properties) {
  properties = Object.assign({
    code: 500,
    name: 'invalid_argument'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidArgumentError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidArgumentError;
