
/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidGrantError(message, properties) {
  properties = _.assign({
    code: 400,
    name: 'invalid_grant'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidGrantError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidGrantError;
