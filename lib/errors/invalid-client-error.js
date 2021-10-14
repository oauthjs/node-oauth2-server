'use strict';

/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 *
 * "Client authentication failed (e.g., unknown client, no client
 * authentication included, or unsupported authentication method)"
 *
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
 */

function InvalidClientError(message, properties) {
  properties = Object.assign({
    code: 400,
    name: 'invalid_client'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidClientError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidClientError;
