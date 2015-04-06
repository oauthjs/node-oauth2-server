
/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function UnauthorizedClientError(message, properties) {
  properties = _.assign({
    code: 400,
    name: 'unauthorized_client'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(UnauthorizedClientError, OAuthError);

/**
 * Export constructor.
 */

module.exports = UnauthorizedClientError;
