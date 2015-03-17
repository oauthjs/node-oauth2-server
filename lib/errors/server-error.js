
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function ServerError(message) {
  OAuthError.call(this, {
    code: 503,
    message: message,
    name: 'server_error'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(ServerError, OAuthError);

/**
 * Export constructor.
 */

module.exports = ServerError;
