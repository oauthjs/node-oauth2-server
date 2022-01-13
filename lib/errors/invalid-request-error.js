'use strict';

/**
 * Module dependencies.
 */

const OAuthError = require('./oauth-error');
const util = require('util');

/**
 * Constructor.
 *
 * "The request is missing a required parameter, includes an invalid parameter value,
 * includes a parameter more than once, or is otherwise malformed."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.2.2.1
 */

function InvalidRequest(message, properties) {
  properties = Object.assign({
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
