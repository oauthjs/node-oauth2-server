'use strict';

/**
 * Module dependencies.
 */

const AccessDeniedError = require('../errors/access-denied-error');
const AuthenticateHandler = require('../handlers/authenticate-handler');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidClientError = require('../errors/invalid-client-error');
const InvalidRequestError = require('../errors/invalid-request-error');
const InvalidScopeError = require('../errors/invalid-scope-error');
const UnsupportedResponseTypeError = require('../errors/unsupported-response-type-error');
const OAuthError = require('../errors/oauth-error');
const Promise = require('bluebird');
const promisify = require('promisify-any').use(Promise);
const Request = require('../request');
const Response = require('../response');
const ServerError = require('../errors/server-error');
const UnauthorizedClientError = require('../errors/unauthorized-client-error');
const isFormat = require('@node-oauth/formats');
const tokenUtil = require('../utils/token-util');
const url = require('url');

/**
 * Response types.
 */

const responseTypes = {
  code: require('../response-types/code-response-type'),
  //token: require('../response-types/token-response-type')
};

/**
 * Constructor.
 */

function AuthorizeHandler(options) {
  options = options || {};

  if (options.authenticateHandler && !options.authenticateHandler.handle) {
    throw new InvalidArgumentError('Invalid argument: authenticateHandler does not implement `handle()`');
  }

  if (!options.authorizationCodeLifetime) {
    throw new InvalidArgumentError('Missing parameter: `authorizationCodeLifetime`');
  }

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getClient) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
  }

  if (!options.model.saveAuthorizationCode) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveAuthorizationCode()`');
  }

  this.allowEmptyState = options.allowEmptyState;
  this.authenticateHandler = options.authenticateHandler || new AuthenticateHandler(options);
  this.authorizationCodeLifetime = options.authorizationCodeLifetime;
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

  if (request.query.allowed === 'false' || request.body.allowed === 'false') {
    return Promise.reject(new AccessDeniedError('Access denied: user denied access to application'));
  }

  const fns = [
    this.getAuthorizationCodeLifetime(),
    this.getClient(request),
    this.getUser(request, response)
  ];

  return Promise.all(fns)
    .bind(this)
    .spread(function(expiresAt, client, user) {
      const uri = this.getRedirectUri(request, client);
      let scope;
      let state;
      let ResponseType;

      return Promise.bind(this)
        .then(function() {
          state = this.getState(request);
          if(request.query.allowed === 'false') {
            throw new AccessDeniedError('Access denied: user denied access to application');
          }
        })
        .then(function() {
          const requestedScope = this.getScope(request);

          return this.validateScope(user, client, requestedScope);
        })
        .then(function(validScope) {
          scope = validScope;

          return this.generateAuthorizationCode(client, user, scope);
        })
        .then(function(authorizationCode) {
          ResponseType = this.getResponseType(request);

          return this.saveAuthorizationCode(authorizationCode, expiresAt, scope, client, uri, user);
        })
        .then(function(code) {
          const responseType = new ResponseType(code.authorizationCode);
          const redirectUri = this.buildSuccessRedirectUri(uri, responseType);

          this.updateResponse(response, redirectUri, state);

          return code;
        })
        .catch(function(e) {
          if (!(e instanceof OAuthError)) {
            e = new ServerError(e);
          }
          const redirectUri = this.buildErrorRedirectUri(uri, e);

          this.updateResponse(response, redirectUri, state);

          throw e;
        });
    });
};

/**
 * Generate authorization code.
 */

AuthorizeHandler.prototype.generateAuthorizationCode = function(client, user, scope) {
  if (this.model.generateAuthorizationCode) {
    return promisify(this.model.generateAuthorizationCode, 3).call(this.model, client, user, scope);
  }
  return tokenUtil.generateRandomToken();
};

/**
 * Get authorization code lifetime.
 */

AuthorizeHandler.prototype.getAuthorizationCodeLifetime = function() {
  const expires = new Date();

  expires.setSeconds(expires.getSeconds() + this.authorizationCodeLifetime);
  return expires;
};

/**
 * Get the client from the model.
 */

AuthorizeHandler.prototype.getClient = function(request) {
  const self = this;
  const clientId = request.body.client_id || request.query.client_id;

  if (!clientId) {
    throw new InvalidRequestError('Missing parameter: `client_id`');
  }

  if (!isFormat.vschar(clientId)) {
    throw new InvalidRequestError('Invalid parameter: `client_id`');
  }

  const redirectUri = request.body.redirect_uri || request.query.redirect_uri;

  if (redirectUri && !isFormat.uri(redirectUri)) {
    throw new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI');
  }
  return promisify(this.model.getClient, 2).call(this.model, clientId, null)
    .then(function(client) {
      if (!client) {
        throw new InvalidClientError('Invalid client: client credentials are invalid');
      }

      if (!client.grants) {
        throw new InvalidClientError('Invalid client: missing client `grants`');
      }

      if (!Array.isArray(client.grants) || !client.grants.includes('authorization_code')) {
        throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
      }

      if (!client.redirectUris || 0 === client.redirectUris.length) {
        throw new InvalidClientError('Invalid client: missing client `redirectUri`');
      }

      if (redirectUri) {
        return self.validateRedirectUri(redirectUri, client)
          .then(function(valid) {
            if (!valid) {
              throw new InvalidClientError('Invalid client: `redirect_uri` does not match client value');
            }
            return client;
          });
      } else {
        return client;
      }
    });
};

/**
 * Validate requested scope.
 */
AuthorizeHandler.prototype.validateScope = function(user, client, scope) {
  if (this.model.validateScope) {
    return promisify(this.model.validateScope, 3).call(this.model, user, client, scope)
      .then(function (scope) {
        if (!scope) {
          throw new InvalidScopeError('Invalid scope: Requested scope is invalid');
        }

        return scope;
      });
  } else {
    return Promise.resolve(scope);
  }
};

/**
 * Get scope from the request.
 */

AuthorizeHandler.prototype.getScope = function(request) {
  const scope = request.body.scope || request.query.scope;

  if (!isFormat.nqschar(scope)) {
    throw new InvalidScopeError('Invalid parameter: `scope`');
  }

  return scope;
};

/**
 * Get state from the request.
 */

AuthorizeHandler.prototype.getState = function(request) {
  const state = request.body.state || request.query.state;
  const stateExists = state && state.length > 0;
  const stateIsValid = stateExists
    ? isFormat.vschar(state)
    : this.allowEmptyState;

  if (!stateIsValid) {
    const message = (!stateExists) ? 'Missing' : 'Invalid';
    throw new InvalidRequestError(`${message} parameter: \`state\``);
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
  return promisify(this.authenticateHandler.handle, 2)(request, response).then(function(user) {
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
 * Save authorization code.
 */

AuthorizeHandler.prototype.saveAuthorizationCode = function(authorizationCode, expiresAt, scope, client, redirectUri, user) {
  const code = {
    authorizationCode: authorizationCode,
    expiresAt: expiresAt,
    redirectUri: redirectUri,
    scope: scope
  };
  return promisify(this.model.saveAuthorizationCode, 3).call(this.model, code, client, user);
};


AuthorizeHandler.prototype.validateRedirectUri = function(redirectUri, client) {
  if (this.model.validateRedirectUri) {
    return promisify(this.model.validateRedirectUri, 2).call(this.model, redirectUri, client);
  }

  return Promise.resolve(client.redirectUris.includes(redirectUri));
};
/**
 * Get response type.
 */

AuthorizeHandler.prototype.getResponseType = function(request) {
  const responseType = request.body.response_type || request.query.response_type;

  if (!responseType) {
    throw new InvalidRequestError('Missing parameter: `response_type`');
  }

  if (!Object.prototype.hasOwnProperty.call(responseTypes, responseType)) {
    throw new UnsupportedResponseTypeError('Unsupported response type: `response_type` is not supported');
  }

  return responseTypes[responseType];
};

/**
 * Build a successful response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildSuccessRedirectUri = function(redirectUri, responseType) {
  return responseType.buildRedirectUri(redirectUri);
};

/**
 * Build an error response that redirects the user-agent to the client-provided url.
 */

AuthorizeHandler.prototype.buildErrorRedirectUri = function(redirectUri, error) {
  const uri = url.parse(redirectUri);

  uri.query = {
    error: error.name
  };

  if (error.message) {
    uri.query.error_description = error.message;
  }

  return uri;
};

/**
 * Update response with the redirect uri and the state parameter, if available.
 */

AuthorizeHandler.prototype.updateResponse = function(response, redirectUri, state) {
  redirectUri.query = redirectUri.query || {};

  if (state) {
    redirectUri.query.state = state;
  }

  response.redirect(url.format(redirectUri));
};

/**
 * Export constructor.
 */

module.exports = AuthorizeHandler;
