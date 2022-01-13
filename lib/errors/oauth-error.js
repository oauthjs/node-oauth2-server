'use strict';

/**
 * Module dependencies.
 */
const util = require('util');
const http = require('http');
/**
 * Constructor.
 */

function OAuthError(messageOrError, properties) {
  let message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
  const error = messageOrError instanceof Error ? messageOrError : null;
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
  for (const key in properties) {
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
