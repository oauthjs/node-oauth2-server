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
 * "The provided authorization grant (e.g., authorization code, resource owner credentials)
 * or refresh token is invalid, expired, revoked, does not match the redirection URI used
 * in the authorization request, or was issued to another client."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
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
