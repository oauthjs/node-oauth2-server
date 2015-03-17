
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidClientError(message) {
  OAuthError.call(this, {
    code: 400,
    message: message,
    name: 'invalid_client'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidClientError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidClientError;
