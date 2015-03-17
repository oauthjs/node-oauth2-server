
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidTokenError(message) {
  OAuthError.call(this, {
    code: 401,
    message: message,
    name: 'invalid_token'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidTokenError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidTokenError;
