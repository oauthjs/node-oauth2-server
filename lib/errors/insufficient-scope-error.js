'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');
const util = require('util');

/**
 * Constructor.
 *
 * "The request requires higher privileges than provided by the access token.."
 *
 * @see https://tools.ietf.org/html/rfc6750.html#section-3.1
 */

function InsufficientScopeError(message, properties) {
  properties = Object.assign({
    code: 403,
    name: 'insufficient_scope'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InsufficientScopeError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InsufficientScopeError;
