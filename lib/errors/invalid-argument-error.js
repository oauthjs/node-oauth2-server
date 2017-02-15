'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var OAuthError = require('./oauth-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidArgumentError(message, properties) {
  properties = _.assign({
    code: 500,
    name: 'invalid_argument'
  }, properties);

  OAuthError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidArgumentError, OAuthError);

/**
 * Export constructor.
 */

module.exports = InvalidArgumentError;
