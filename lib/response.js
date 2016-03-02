
/**
 * Constructor.
 */

function Response(options) {
  options = options || {};

  this.body = options.body || {};
  this.headers = {};
  this.status = 200;

  // Store the headers in lower case.
  for (var field in options.headers) {
    this.headers[field.toLowerCase()] = options.headers[field];
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
