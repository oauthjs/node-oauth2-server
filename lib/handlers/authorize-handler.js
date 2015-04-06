
/**
 * Module dependencies.
 */

var _ = require('lodash');
var AccessDeniedError = require('../errors/access-denied-error');
var AuthenticateHandler = require('../handlers/authenticate-handler');
var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidClientError = require('../errors/invalid-client-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var OAuthError = require('../errors/oauth-error');
var Promise = require('bluebird');
var Request = require('../request');
var Response = require('../response');
var ServerError = require('../errors/server-error');
var UnauthorizedClientError = require('../errors/unauthorized-client-error');
var is = require('../validator/is');
var tokenUtil = require('../utils/token-util');
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

  if (!options.authCodeLifetime) {
    throw new InvalidArgumentError('Missing parameter: `authCodeLifetime`');
  }

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getClient) {
    throw new ServerError('Server error: model does not implement `getClient()`');
  }

  if (!options.model.saveAuthCode) {
    throw new ServerError('Server error: model does not implement `saveAuthCode()`');
  }

  this.authCodeLifetime = options.authCodeLifetime;
  this.authenticateHandler = new AuthenticateHandler(options);
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
    this.generateAuthCode(),
    this.getAuthCodeLifetime(),
    this.getClient(request),
    this.getScope(request),
    this.getState(request),
    this.getUser(request)
  ];

  return Promise.all(fns)
    .bind(this)
    .spread(function(authCode, expiresOn, client, scope, state, user) {
      return this.saveAuthCode(authCode, expiresOn, scope, client, user)
        .bind(this)
        .then(function(code) {
          var responseType = this.getResponseType(request, code);
          var redirectUri = this.buildSuccessRedirectUri(client.redirectUri, responseType);

          this.updateResponse(response, redirectUri, state);

          return code;
        })
        .catch(function(e) {
          if (!(e instanceof OAuthError)) {
            e = new ServerError(e);
          }

          var redirectUri = this.buildErrorRedirectUri(client.redirectUri, e);

          this.updateResponse(response, redirectUri, state);

          throw e;
        });
    });
};

/**
 * Generate auth code.
 */

AuthorizeHandler.prototype.generateAuthCode = Promise.method(function() {
  if (this.model.generateAuthCode) {
    return this.model.generateAuthCode();
  }

  return tokenUtil.generateRandomToken();
});

/**
 * Get auth code lifetime.
 */

AuthorizeHandler.prototype.getAuthCodeLifetime = Promise.method(function() {
  var expires = new Date();

  expires.setSeconds(expires.getSeconds() + this.authCodeLifetime);

  return expires;
});

/**
 * Get the client from the model.
 */

AuthorizeHandler.prototype.getClient = Promise.method(function(request) {
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

      if (!client.redirectUri) {
        throw new InvalidClientError('Invalid client: missing client `redirectUri`');
      }

      if (redirectUri && client.redirectUri !== redirectUri) {
        throw new InvalidClientError('Invalid client: `redirect_uri` does not match client value');
      }

      return client;
    });
});

/**
 * Get scope from the request body.
 */

AuthorizeHandler.prototype.getScope = Promise.method(function(request) {
  if (!is.nqschar(request.body.scope)) {
    throw new InvalidArgumentError('Invalid parameter: `scope`');
  }

  return request.body.scope;
});

/**
 * Get state from the request.
 */

AuthorizeHandler.prototype.getState = Promise.method(function(request) {
  var state = request.body.state || request.query.state;

  if (!state) {
    throw new InvalidRequestError('Missing parameter: `state`');
  }

  if (!is.vschar(state)) {
    throw new InvalidRequestError('Invalid parameter: `state`');
  }

  return state;
});

/**
 * Get user by calling the authenticate middleware.
 */

AuthorizeHandler.prototype.getUser = Promise.method(function(request) {
  return this.authenticateHandler.handle(request).then(function(token) {
    return token.user;
  });
});

/**
 * Save auth code.
 */

AuthorizeHandler.prototype.saveAuthCode = Promise.method(function(authCode, expiresOn, scope, client, user) {
  var code = {
    authCode: authCode,
    expiresOn: expiresOn,
    scope: scope
  };

  return this.model.saveAuthCode(code, client, user);
});

/**
 * Get response type.
 */

AuthorizeHandler.prototype.getResponseType = function(request, code) {
  var responseType = request.body.response_type || request.query.response_type;

  if (!responseType) {
    throw new InvalidRequestError('Missing parameter: `response_type`');
  }

  if (!_.contains(['code'], responseType)) {
    throw new InvalidRequestError('Invalid parameter: `response_type`');
  }

  var Type = responseTypes[responseType];

  return new Type(code.authCode);
};

/**
 * Build a successful response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildSuccessRedirectUri = function(redirectUri, responseType) {
  return responseType.getRedirectUri(redirectUri);
};

/**
 * Build an error response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildErrorRedirectUri = function(redirectUri, error) {
  var uri = url.parse(redirectUri);

  uri.query = {
    error: error.name
  };

  if (error.message) {
    uri.query.error_description = error.message;
  }

  return uri;
};

/**
 * Update response with the redirect uri and state parameter.
 */

AuthorizeHandler.prototype.updateResponse = function(response, redirectUri, state) {
  redirectUri.query = redirectUri.query || {};
  redirectUri.query.state = state;

  response.redirect(url.format(redirectUri));
};

/**
 * Export constructor.
 */

module.exports = AuthorizeHandler;
