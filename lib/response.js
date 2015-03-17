
/**
 * Constructor.
 */

function Response(options) {
  options = options || {};

  this.body = options.body || {};
  this.headers = options.headers || [];
  this.status = 200;
}

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
