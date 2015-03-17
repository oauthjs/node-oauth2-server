/**
 * Module dependencies.
 */

var OAuthError = require('standard-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidArgumentError(message) {
  OAuthError.call(this, {
    code: 500,
    message: message
  });
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidArgumentError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidArgumentError;
