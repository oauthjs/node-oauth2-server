
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function UnsupportedGrantTypeError(message) {
  OAuthError.call(this, {
    code: 400,
    message: message,
    name: 'unsupported_grant_type'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(UnsupportedGrantTypeError, OAuthError);

/**
 * Export constructor.
 */

module.exports = UnsupportedGrantTypeError;
