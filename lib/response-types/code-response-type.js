'use strict';

/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var url = require('url');

/**
 * Constructor.
 */

function CodeResponseType(code) {
  if (!code) {
    throw new InvalidArgumentError('Missing parameter: `code`');
  }

  this.code = code;
}

/**
 * Build redirect uri.
 */

CodeResponseType.prototype.buildRedirectUri = function(redirectUri) {
  if (!redirectUri) {
    throw new InvalidArgumentError('Missing parameter: `redirectUri`');
  }

  var uri = url.parse(redirectUri, true);

  uri.query.code = this.code;
  uri.search = null;

  return uri;
};

/**
 * Export constructor.
 */

module.exports = CodeResponseType;
