
/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidRequest(message, properties) {
  properties = _.assign({
    code: 400,
    name: 'invalid_request'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidRequest, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidRequest;
