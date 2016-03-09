'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var AccessDeniedError = require('../errors/access-denied-error');
var AuthenticateHandler = require('../handlers/authenticate-handler');
var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidClientError = require('../errors/invalid-client-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var InvalidScopeError = require('../errors/invalid-scope-error');
var OAuthError = require('../errors/oauth-error');
var Promise = require('bluebird');
var Request = require('../request');
var Response = require('../response');
var ServerError = require('../errors/server-error');
var UnauthorizedClientError = require('../errors/unauthorized-client-error');
var is = require('../validator/is');
var url = require('url');

/**
 * Response types.
 */

var responseTypes = {
  code: require('../response-types/code-response-type'),
  token: require('../response-types/token-response-type')
};

/**
 * Constructor.
 */

function AuthorizeHandler(options) {
  options = options || {};

  if (options.authenticateHandler && !options.authenticateHandler.handle) {
    throw new InvalidArgumentError('Invalid argument: authenticateHandler does not implement `handle()`');
  }

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getClient) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
  }

  this.options = options;
  this.allowEmptyState = options.allowEmptyState;
  this.authenticateHandler = options.authenticateHandler || new AuthenticateHandler(options);
  this.model = options.model;
}

/**
 * Authorize Handler.
 */

AuthorizeHandler.prototype.handle = function(request, response) {
  if (!(request instanceof Request)) {
    throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
  }

  if (!(response instanceof Response)) {
    throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
  }

  if ('false' === request.query.allowed) {
    return Promise.reject(new AccessDeniedError('Access denied: user denied access to application'));
  }

  var fns = [
    this.getClient(request),
    this.getUser(request, response)
  ];

  return Promise.all(fns)
    .bind(this)
    .spread(function(client, user) {
      var scope;
      var state;
      var responseType = this.getResponseType(request, client);
      var uri = this.getRedirectUri(request, client);

      return Promise
        .bind(this)
        .then(function() {
          scope = this.getScope(request);
          state = this.getState(request);

          return responseType.handle(request, client, user, uri, scope);
        })
        .then(function(codeOrAccessToken) {
          var redirectUri = this.buildSuccessRedirectUri(uri, responseType);

          this.updateResponse(response, redirectUri, responseType, state);

          return codeOrAccessToken;
        })
        .catch(function(e) {
          if (!(e instanceof OAuthError)) {
            e = new ServerError(e);
          }

          var redirectUri = this.buildErrorRedirectUri(uri, responseType, e);

          this.updateResponse(response, redirectUri, responseType, state);

          throw e;
        });
    });
};

/**
 * Get the client from the model.
 */

AuthorizeHandler.prototype.getClient = function(request) {
  var clientId = request.body.client_id || request.query.client_id;

  if (!clientId) {
    throw new InvalidRequestError('Missing parameter: `client_id`');
  }

  if (!is.vschar(clientId)) {
    throw new InvalidRequestError('Invalid parameter: `client_id`');
  }

  var redirectUri = request.body.redirect_uri || request.query.redirect_uri;

  if (redirectUri && !is.uri(redirectUri)) {
    throw new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI');
  }

  return Promise.try(this.model.getClient, clientId)
    .then(function(client) {
      if (!client) {
        throw new InvalidClientError('Invalid client: client credentials are invalid');
      }

      if (!client.grants) {
        throw new InvalidClientError('Invalid client: missing client `grants`');
      }

      if (!_.contains(client.grants, 'authorization_code')) {
        throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
      }

      if (!client.redirectUris || 0 === client.redirectUris.length) {
        throw new InvalidClientError('Invalid client: missing client `redirectUri`');
      }

      if (redirectUri && !_.contains(client.redirectUris, redirectUri)) {
        throw new InvalidClientError('Invalid client: `redirect_uri` does not match client value');
      }

      return client;
    });
};

/**
 * Get scope from the request.
 */

AuthorizeHandler.prototype.getScope = function(request) {
  var scope = request.body.scope || request.query.scope;

  if (!is.nqschar(scope)) {
    throw new InvalidScopeError('Invalid parameter: `scope`');
  }

  return scope;
};

/**
 * Get state from the request.
 */

AuthorizeHandler.prototype.getState = function(request) {
  var state = request.body.state || request.query.state;

  if (!this.allowEmptyState && !state) {
    throw new InvalidRequestError('Missing parameter: `state`');
  }

  if (!is.vschar(state)) {
    throw new InvalidRequestError('Invalid parameter: `state`');
  }

  return state;
};

/**
 * Get user by calling the authenticate middleware.
 */

AuthorizeHandler.prototype.getUser = function(request, response) {
  if (this.authenticateHandler instanceof AuthenticateHandler) {
    return this.authenticateHandler.handle(request, response).get('user');
  }

  return Promise.try(this.authenticateHandler.handle, [request, response]).then(function(user) {
    if (!user) {
      throw new ServerError('Server error: `handle()` did not return a `user` object');
    }

    return user;
  });
};

/**
 * Get redirect URI.
 */

AuthorizeHandler.prototype.getRedirectUri = function(request, client) {
  return request.body.redirect_uri || request.query.redirect_uri || client.redirectUris[0];
};

/**
 * Get response type.
 */

AuthorizeHandler.prototype.getResponseType = function(request, client) {
  var responseType = request.body.response_type || request.query.response_type;

  if (!responseType) {
    throw new InvalidRequestError('Missing parameter: `response_type`');
  }

  if (!_.contains(['code', 'token'], responseType)) {
    throw new InvalidRequestError('Invalid parameter: `response_type`');
  }

  if (!_.contains(client.grants, 'implicit') && responseType === 'token') {
    throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
  }

  var Type = responseTypes[responseType];

  return new Type(this.options);
};

/**
 * Build a successful response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildSuccessRedirectUri = function(redirectUri, responseType) {
  var uri = url.parse(redirectUri);
  return responseType.buildRedirectUri(uri);
};

/**
 * Build an error response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildErrorRedirectUri = function(redirectUri, responseType, error) {
  var uri = url.parse(redirectUri);

  uri = responseType.setRedirectUriParam(uri, 'error', error.name);

  if (error.message) {
    uri = responseType.setRedirectUriParam(uri, 'error_description', error.message);
  }

  return uri;
};

/**
 * Update response with the redirect uri and the state parameter, if available.
 */

AuthorizeHandler.prototype.updateResponse = function(response, redirectUri, responseType, state) {
  if (state) {
    redirectUri = responseType.setRedirectUriParam(redirectUri, 'state', state);
  }

  response.redirect(url.format(redirectUri));
};

/**
 * Export constructor.
 */

module.exports = AuthorizeHandler;
