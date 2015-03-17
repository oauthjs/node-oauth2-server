
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function AccessDeniedError(message) {
  OAuthError.call(this, {
    code: 400,
    message: message,
    name: 'access_denied'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(AccessDeniedError, OAuthError);

/**
 * Export constructor.
 */

module.exports = AccessDeniedError;
