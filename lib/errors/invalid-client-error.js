
/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidClientError(message, properties) {
  properties = _.assign({
    code: 400,
    name: 'invalid_client'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidClientError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidClientError;
