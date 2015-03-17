
/**
 * Module dependencies.
 */

var StandardError = require("standard-error");
var util = require('util');

/**
 * Constructor.
 */

function OAuthError(message, properties) {
  StandardError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(OAuthError, StandardError);

/**
 * Export constructor.
 */

module.exports = OAuthError;
