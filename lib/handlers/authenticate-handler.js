
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var InvalidScopeError = require('../errors/invalid-scope-error');
var InvalidTokenError = require('../errors/invalid-token-error');
var Promise = require('bluebird');
var Request = require('../request');
var ServerError = require('../errors/server-error');

/**
 * Constructor.
 */

function AuthenticateHandler(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getAccessToken) {
    throw new ServerError('Server error: model does not implement `getAccessToken()`');
  }

  if (options.scope && !options.model.validateScope) {
    throw new ServerError('Server error: model does not implement `validateScope()`');
  }

  this.model = options.model;
  this.scope = options.scope;
}

/**
 * Authenticate Handler.
 */

AuthenticateHandler.prototype.handle = function(request) {
  if (!(request instanceof Request)) {
    throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
  }

  return this.getToken(request)
    .bind(this)
    .then(this.getAccessToken)
    .then(function(accessToken) {
      return this.validateAccessToken(accessToken)
        .bind(this)
        .then(this.validateScope)
        .then(function() {
          return accessToken;
        });
    });
};

/**
 * Get the token from the header or body, depending on the request.
 */

AuthenticateHandler.prototype.getToken = Promise.method(function(request) {
  var headerToken = request.get('Authorization');
  var queryToken = request.query.access_token;
  var bodyToken = request.body.access_token;

  if (!!headerToken + !!queryToken + !!bodyToken > 1) {
    throw new InvalidRequestError('Invalid request: only one authentication method is allowed');
  }

  if (headerToken) {
    return this.getTokenFromRequestHeader(request);
  }

  if (queryToken) {
    return this.getTokenFromRequestQuery(request);
  }

  if (bodyToken) {
    return this.getTokenFromRequestBody(request);
  }

  throw new InvalidRequestError('Invalid request: no access token given');
});

/**
 * Get the token from the request header.
 *
 * (See: http://tools.ietf.org/html/rfc6750#section-2.1)
 */

AuthenticateHandler.prototype.getTokenFromRequestHeader = Promise.method(function(request) {
  var token = request.get('Authorization');
  var matches = token.match(/Bearer\s(\S+)/);

  if (!matches) {
    throw new InvalidRequestError('Invalid request: malformed authorization header');
  }

  return matches[1];
});

/**
 * Get the token from the request query.
 *
 * (See: http://tools.ietf.org/html/rfc6750#section-2.3)
 */

AuthenticateHandler.prototype.getTokenFromRequestQuery = Promise.method(function() {
  throw new InvalidRequestError('Invalid request: do not send bearer tokens in query URLs');
});

/**
 * Get the token from the request body.
 *
 * (See: http://tools.ietf.org/html/rfc6750#section-2.2)
 */

AuthenticateHandler.prototype.getTokenFromRequestBody = Promise.method(function(request) {
  if ('GET' === request.method) {
    throw new InvalidRequestError('Invalid request: token may not be passed in the body when using the GET verb');
  }

  if (!request.is('application/x-www-form-urlencoded')) {
    throw new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded');
  }

  return request.body.access_token;
});

/**
 * Get the access token from the model.
 */

AuthenticateHandler.prototype.getAccessToken = Promise.method(function(token) {
  return Promise.try(this.model.getAccessToken, token)
    .then(function(accessToken) {
      if (!accessToken) {
        throw new InvalidTokenError('Invalid token: access token is invalid');
      }

      if (!accessToken.user) {
        throw new ServerError('Server error: `getAccessToken()` did not return a `user` object');
      }

      return accessToken;
    });
});

/**
 * Validate access token.
 */

AuthenticateHandler.prototype.validateAccessToken = Promise.method(function(accessToken) {
  if (accessToken.accessTokenExpiresOn && !(accessToken.accessTokenExpiresOn instanceof Date)) {
    throw new ServerError('Server error: `expires` must be a Date instance');
  }

  if (accessToken.accessTokenExpiresOn && accessToken.accessTokenExpiresOn < new Date()) {
    throw new InvalidTokenError('Invalid token: access token has expired');
  }

  return accessToken;
});

/**
 * Validate scope.
 */

AuthenticateHandler.prototype.validateScope = Promise.method(function(accessToken) {
  if (!this.scope) {
    return;
  }

  return Promise.try(this.model.validateScope, [accessToken, this.scope]).then(function(scope) {
    if (!scope) {
      throw new InvalidScopeError('Invalid scope: scope is invalid');
    }

    return scope;
  });
});

/**
 * Export constructor.
 */

module.exports = AuthenticateHandler;
