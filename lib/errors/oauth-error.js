'use strict';

/**
 * Module dependencies.
 */
var util = require('util');
var http = require('http');
/**
 * Constructor.
 */

function OAuthError(messageOrError, properties) {
  var message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
  var error = messageOrError instanceof Error ? messageOrError : null;
  if (properties == null || !Object.entries(properties).length ) {
    properties = {};
  }

  properties = Object.assign({ code: 500 }, properties);

  if (error) {
    properties.inner = error;
  }
  if (!message || message.length === 0) {
    message = http.STATUS_CODES[properties.code];
  }
  this.code = this.status = this.statusCode = properties.code;
  this.message = message;
  for (var key in properties) {
    if (key !== 'code') {
      this[key] = properties[key];
    }
  }
  Error.captureStackTrace(this, OAuthError);
}

util.inherits(OAuthError, Error);

/**
 * Export constructor.
 */

module.exports = OAuthError;
