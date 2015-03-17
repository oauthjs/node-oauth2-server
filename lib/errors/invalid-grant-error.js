
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidGrantError(message) {
  OAuthError.call(this, {
    code: 400,
    message: message,
    name: 'invalid_grant'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidGrantError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidGrantError;
