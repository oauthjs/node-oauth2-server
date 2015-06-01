
/**
 * Module dependencies.
 */

var _ = require('lodash');
var StandardHttpError = require('standard-http-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidArgumentError(message, properties) {
  properties = _.assign({
    code: 500,
    name: 'invalid_argument'
  }, properties);

  StandardHttpError.call(this, properties.code, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidArgumentError, StandardHttpError);

/**
 * Export constructor.
 */

module.exports = InvalidArgumentError;
