
/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function ServerError(message, properties) {
  properties = _.assign({
    code: 503,
    name: 'server_error'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(ServerError, OAuthError);

/**
 * Export constructor.
 */

module.exports = ServerError;
