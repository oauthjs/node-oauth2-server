
/**
 * Module dependencies.
 */

var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidRequest(message) {
  OAuthError.call(this, {
    code: 400,
    message: message,
    name: 'invalid_request'
  });
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidRequest, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidRequest;
