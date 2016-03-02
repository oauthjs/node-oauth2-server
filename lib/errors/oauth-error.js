
/**
 * Module dependencies.
 */

var StandardHttpError = require('standard-http-error');
var util = require('util');

/**
 * Constructor.
 */

function OAuthError(messageOrError, properties) {
  var message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
  var error = messageOrError instanceof Error ? messageOrError : null;

  if (error) {
    properties.inner = error;
  }

  StandardHttpError.call(this, properties.code, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(OAuthError, StandardHttpError);

/**
 * Export constructor.
 */

module.exports = OAuthError;
