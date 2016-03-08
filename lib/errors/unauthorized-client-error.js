'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 *
 * "The authenticated client is not authorized to use this authorization grant type."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
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
