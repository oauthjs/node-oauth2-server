
/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidScopeError(message, properties) {
  properties = _.assign({
    code: 400,
    name: 'invalid_scope'
  }, properties);

  OAuthError.call(this, message, properties);

}

/**
 * Inherit prototype.
 */

util.inherits(InvalidScopeError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidScopeError;
