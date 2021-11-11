'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');
const util = require('util');

/**
 * Constructor.
 *
 * "The access token provided is expired, revoked, malformed, or invalid for other reasons."
 *
 * @see https://tools.ietf.org/html/rfc6750#section-3.1
 */

function InvalidTokenError(message, properties) {
  properties = Object.assign({
    code: 401,
    name: 'invalid_token'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidTokenError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidTokenError;
