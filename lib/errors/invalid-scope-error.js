
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidScopeError(message) {
  OAuthError.call(this, {
    code: 400,
    message: message,
    name: 'invalid_scope'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidScopeError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidScopeError;
