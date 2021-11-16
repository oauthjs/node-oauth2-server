'use strict';

/**
 * Constructor.
 */

function Response(options) {
  options = options || {};

  this.body = options.body || {};
  this.headers = {};
  this.status = 200;

  // Store the headers in lower case.
  for (const field in options.headers) {
    if (Object.prototype.hasOwnProperty.call(options.headers, field)) {
      this.headers[field.toLowerCase()] = options.headers[field];
    }
  }

  // Store additional properties of the response object passed in
  for (const property in options) {
    if (Object.prototype.hasOwnProperty.call(options, property) && !this[property]) {
      this[property] = options[property];
    }
  }
}

/**
 * Get a response header.
 */

Response.prototype.get = function(field) {
  return this.headers[field.toLowerCase()];
};

/**
 * Redirect response.
 */

Response.prototype.redirect = function(url) {
  this.set('Location', url);
  this.status = 302;
};

/**
 * Set a response header.
 */

Response.prototype.set = function(field, value) {
  this.headers[field.toLowerCase()] = value;
};

/**
 * Export constructor.
 */

module.exports = Response;
