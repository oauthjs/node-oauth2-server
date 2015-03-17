
/**
 * Module dependencies.
 */

var _ = require('lodash');
var AuthenticateHandler = require('./handlers/authenticate-handler');
var AuthorizeHandler = require('./handlers/authorize-handler');
var InvalidArgumentError = require('./errors/invalid-argument-error');
var TokenHandler = require('./handlers/token-handler');

/**
 * Constructor.
 */

function OAuth2Server(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  this.options = _.assign({
    accessTokenLifetime: 60 * 60,
    authCodeLifetime: 5 * 60,
    refreshTokenLifetime: 1209600
  }, options);
}

/**
 * Authenticate a token.
 */

OAuth2Server.prototype.authenticate = function(request, callback) {
  return new AuthenticateHandler(this.options)
    .handle(request)
    .nodeify(callback);
};

/**
 * Authorize a request.
 */

OAuth2Server.prototype.authorize = function(request, response, callback) {
  return new AuthorizeHandler(this.options)
    .handle(request, response)
    .nodeify(callback);
};

/**
 * Create a token.
 */

OAuth2Server.prototype.token = function(request, response, callback) {
  return new TokenHandler(this.options)
    .handle(request, response)
    .nodeify(callback);
};

/**
 * Export constructor.
 */

module.exports = OAuth2Server;
