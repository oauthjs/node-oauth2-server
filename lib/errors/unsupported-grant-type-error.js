
/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function UnsupportedGrantTypeError(message, properties) {
  properties = _.assign({
    code: 400,
    name: 'unsupported_grant_type'
  }, properties);

  OAuthError.call(this, message, properties);
  }

/**
 * Inherit prototype.
 */

util.inherits(UnsupportedGrantTypeError, OAuthError);

/**
 * Export constructor.
 */

module.exports = UnsupportedGrantTypeError;
