'use strict';

/**
 * Module dependencies.
 */

const AuthenticateHandler = require('./handlers/authenticate-handler');
const AuthorizeHandler = require('./handlers/authorize-handler');
const InvalidArgumentError = require('./errors/invalid-argument-error');
const TokenHandler = require('./handlers/token-handler');

/**
 * Constructor.
 */

function OAuth2Server(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  this.options = options;
}

/**
 * Authenticate a token.
 */

OAuth2Server.prototype.authenticate = function(request, response, options, callback) {
  if (typeof options === 'string') {
    options = {scope: options};
  }

  options = Object.assign({
    addAcceptedScopesHeader: true,
    addAuthorizedScopesHeader: true,
    allowBearerTokensInQueryString: false
  }, this.options, options);

  return new AuthenticateHandler(options)
    .handle(request, response)
    .nodeify(callback);
};

/**
 * Authorize a request.
 */

OAuth2Server.prototype.authorize = function(request, response, options, callback) {
  options = Object.assign({
    allowEmptyState: false,
    authorizationCodeLifetime: 5 * 60   // 5 minutes.
  }, this.options, options);

  return new AuthorizeHandler(options)
    .handle(request, response)
    .nodeify(callback);
};

/**
 * Create a token.
 */

OAuth2Server.prototype.token = function(request, response, options, callback) {
  options = Object.assign({
    accessTokenLifetime: 60 * 60,             // 1 hour.
    refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
    allowExtendedTokenAttributes: false,
    requireClientAuthentication: {}           // defaults to true for all grant types
  }, this.options, options);

  return new TokenHandler(options)
    .handle(request, response)
    .nodeify(callback);
};

/**
 * Export constructor.
 */

module.exports = OAuth2Server;
