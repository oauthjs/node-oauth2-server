
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var InvalidScopeError = require('../errors/invalid-scope-error');
var InvalidTokenError = require('../errors/invalid-token-error');
var OAuthError = require('../errors/oauth-error');
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
    throw new InvalidArgumentError('Invalid argument: model does not implement `getAccessToken()`');
  }

  if (options.scope && !options.model.validateScope) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `validateScope()`');
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

  return Promise.bind(this)
    .then(function() {
      return this.getToken(request);
    })
    .then(function(token) {
      return this.getAccessToken(token);
    })
    .tap(function(token) {
      return this.validateAccessToken(token);
    })
    .tap(function(token) {
      if (!this.scope) {
        return;
      }

      return this.validateScope(token);
    })
    .catch(function(e) {
      if (!(e instanceof OAuthError)) {
        throw new ServerError(e);
      }

      throw e;
    });
};

/**
 * Get the token from the header or body, depending on the request.
 *
 * "Clients MUST NOT use more than one method to transmit the token in each request."
 *
 * @see https://tools.ietf.org/html/rfc6750#section-2
 */

AuthenticateHandler.prototype.getToken = function(request) {
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
};

/**
 * Get the token from the request header.
 *
 * @see http://tools.ietf.org/html/rfc6750#section-2.1
 */

AuthenticateHandler.prototype.getTokenFromRequestHeader = function(request) {
  var token = request.get('Authorization');
  var matches = token.match(/Bearer\s(\S+)/);

  if (!matches) {
    throw new InvalidRequestError('Invalid request: malformed authorization header');
  }

  return matches[1];
};

/**
 * Get the token from the request query.
 *
 * "Don't pass bearer tokens in page URLs:  Bearer tokens SHOULD NOT be passed in page
 * URLs (for example, as query string parameters). Instead, bearer tokens SHOULD be
 * passed in HTTP message headers or message bodies for which confidentiality measures
 * are taken. Browsers, web servers, and other software may not adequately secure URLs
 * in the browser history, web server logs, and other data structures. If bearer tokens
 * are passed in page URLs, attackers might be able to steal them from the history data,
 * logs, or other unsecured locations."
 *
 * @see http://tools.ietf.org/html/rfc6750#section-2.3
 */

AuthenticateHandler.prototype.getTokenFromRequestQuery = function() {
  throw new InvalidRequestError('Invalid request: do not send bearer tokens in query URLs');
};

/**
 * Get the token from the request body.
 *
 * "The HTTP request method is one for which the request-body has defined semantics.
 * In particular, this means that the "GET" method MUST NOT be used."
 *
 * @see http://tools.ietf.org/html/rfc6750#section-2.2
 */

AuthenticateHandler.prototype.getTokenFromRequestBody = function(request) {
  if (request.method === 'GET') {
    throw new InvalidRequestError('Invalid request: token may not be passed in the body when using the GET verb');
  }

  if (!request.is('application/x-www-form-urlencoded')) {
    throw new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded');
  }

  return request.body.access_token;
};

/**
 * Get the access token from the model.
 */

AuthenticateHandler.prototype.getAccessToken = function(token) {
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
};

/**
 * Validate access token.
 */

AuthenticateHandler.prototype.validateAccessToken = function(accessToken) {
  if (accessToken.accessTokenExpiresAt && !(accessToken.accessTokenExpiresAt instanceof Date)) {
    throw new ServerError('Server error: `expires` must be a Date instance');
  }

  if (accessToken.accessTokenExpiresAt && accessToken.accessTokenExpiresAt < new Date()) {
    throw new InvalidTokenError('Invalid token: access token has expired');
  }

  return accessToken;
};

/**
 * Validate scope.
 */

AuthenticateHandler.prototype.validateScope = function(accessToken) {
  return Promise.try(this.model.validateScope, [accessToken, this.scope]).then(function(scope) {
    if (!scope) {
      throw new InvalidScopeError('Invalid scope: scope is invalid');
    }

    return scope;
  });
};

/**
 * Export constructor.
 */

module.exports = AuthenticateHandler;
