
/**
 * Module dependencies.
 */

var _ = require('lodash');
var StandardError = require('standard-error');
var util = require('util');

/**
 * Constructor.
 */

function InvalidArgumentError(message, properties) {
  properties = _.assign({
    code: 500,
    name: 'invalid_argument'
  }, properties);

  StandardError.call(this, message, properties);
}

/**
 * Inherit prototype.
 */

util.inherits(InvalidArgumentError, StandardError);

/**
 * Export constructor.
 */

module.exports = InvalidArgumentError;
