
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function UnauthorizedClientError(message) {
  OAuthError.call(this, {
    code: 400,
    message: message,
    name: 'unauthorized_client'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(UnauthorizedClientError, OAuthError);

/**
 * Export constructor.
 */

module.exports = UnauthorizedClientError;
