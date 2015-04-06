
/**
 * Module dependencies.
 */

var StandardError = require('standard-error');
var util = require('util');

/**
 * Constructor.
 */

function OAuthError(messageOrError, properties) {
  var message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
  var error = messageOrError instanceof Error ? messageOrError : null;

  StandardError.call(this, message, properties, error);
}

/**
 * Inherit prototype.
 */

util.inherits(OAuthError, StandardError);

/**
 * Export constructor.
 */

module.exports = OAuthError;
