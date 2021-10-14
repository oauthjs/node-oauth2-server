'use strict';

/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 *
 * "The requested scope is invalid, unknown, or malformed."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

function InvalidScopeError(message, properties) {
  properties = Object.assign({
    code: 400,
    name: 'invalid_scope'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidScopeError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidScopeError;
