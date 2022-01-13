'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');
const util = require('util');

/**
 * Constructor.
 *
 * "The resource owner or authorization server denied the request"
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

function AccessDeniedError(message, properties) {
  properties = Object.assign({
    code: 400,
    name: 'access_denied'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(AccessDeniedError, OAuthError);

/**
 * Export constructor.
 */

module.exports = AccessDeniedError;
