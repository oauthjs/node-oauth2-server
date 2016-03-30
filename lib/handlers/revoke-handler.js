'use strict';

/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidClientError = require('../errors/invalid-client-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var OAuthError = require('../errors/oauth-error');
var Promise = require('bluebird');
var Request = require('../request');
var Response = require('../response');
var ServerError = require('../errors/server-error');
var auth = require('basic-auth');
var is = require('../validator/is');

/**
 * Constructor.
 */

function RevokeHandler(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getClient) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getClient()`');
  }

  if (!options.model.getRefreshToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getRefreshToken()`');
  }

  if (!options.model.revokeToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `revokeToken()`');
  }

  this.model = options.model;
}

/**
 * Revoke Handler.
 */

RevokeHandler.prototype.handle = function(request, response) {
  if (!(request instanceof Request)) {
    throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
  }

  if (!(response instanceof Response)) {
    throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
  }

  if (request.method !== 'POST') {
    return Promise.reject(new InvalidRequestError('Invalid request: method must be POST'));
  }

  if (!request.is('application/x-www-form-urlencoded')) {
    return Promise.reject(new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded'));
  }

  return Promise.bind(this)
    .then(function() {
      return this.getClient(request, response);
    })
    .then(function(client){
      return this.handleRevokeToken(request, client);
    })
    .then(function(){
      /**
       * All necessary information is conveyed in the response code.
       *
       * @see https://tools.ietf.org/html/rfc7009#section-2.1
       */
      return {};
    })
    .catch(function(e) {
      if (!(e instanceof OAuthError)) {
        e = new ServerError(e);
      }

      this.updateErrorResponse(response, e);

      throw e;
    });
};

/**
 * Handle revoke token
 */

RevokeHandler.prototype.handleRevokeToken = function(request, client) {
  return Promise.bind(this)
    .then(function() {
      return this.getTokenFromRequest(request);
    }).then(function (token){
      return this.getRefreshToken(token, client);
    }).tap(function (token) {
      return this.revokeToken(token);
    });
};

/**
 * Get the client from the model.
 */

RevokeHandler.prototype.getClient = function(request, response) {
  var credentials = this.getClientCredentials(request);

  if (!credentials.clientId) {
    throw new InvalidRequestError('Missing parameter: `client_id`');
  }

  if (!credentials.clientSecret) {
    throw new InvalidRequestError('Missing parameter: `client_secret`');
  }

  if (!is.vschar(credentials.clientId)) {
    throw new InvalidRequestError('Invalid parameter: `client_id`');
  }

  if (!is.vschar(credentials.clientSecret)) {
    throw new InvalidRequestError('Invalid parameter: `client_secret`');
  }

  return Promise.try(this.model.getClient, [credentials.clientId, credentials.clientSecret])
    .then(function(client) {
      if (!client) {
        throw new InvalidClientError('Invalid client: client is invalid');
      }

      if (!client.grants) {
        throw new ServerError('Server error: missing client `grants`');
      }

      if (!(client.grants instanceof Array)) {
        throw new ServerError('Server error: `grants` must be an array');
      }

      return client;
    })
    .catch(function(e) {
      // Include the "WWW-Authenticate" response header field if the client
      // attempted to authenticate via the "Authorization" request header.
      //
      // @see https://tools.ietf.org/html/rfc6749#section-5.2.
      if ((e instanceof InvalidClientError) && request.get('authorization')) {
        response.set('WWW-Authenticate', 'Basic realm="Service"');

        throw new InvalidClientError(e, { code: 401 });
      }

      throw e;
    });
};

/**
 * Get client credentials.
 *
 * The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
 * the `client_id` and `client_secret` can be embedded in the body.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
 */

RevokeHandler.prototype.getClientCredentials = function(request) {
  var credentials = auth(request);

  if (credentials) {
    return { clientId: credentials.name, clientSecret: credentials.pass };
  }

  if (request.body.client_id && request.body.client_secret) {
    return { clientId: request.body.client_id, clientSecret: request.body.client_secret };
  }

  throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
};

/**
 * Get the token from the body.
 *
 * @see https://tools.ietf.org/html/rfc7009#section-2.1
 */

RevokeHandler.prototype.getTokenFromRequest = function(request) {
  var bodyToken = request.body.token;

  if (!bodyToken) {
    throw new InvalidRequestError('Missing parameter: `token`');
  }

  return bodyToken;
};


/**
 * Get refresh token.
 */

RevokeHandler.prototype.getRefreshToken = function(token, client) {

  return Promise.try(this.model.getRefreshToken, token)
    .then(function(token) {
      if (!token) {
        throw new InvalidRequestError('Invalid request: refresh token is invalid');
      }

      if (!token.client) {
        throw new ServerError('Server error: `getRefreshToken()` did not return a `client` object');
      }

      if (!token.user) {
        throw new ServerError('Server error: `getRefreshToken()` did not return a `user` object');
      }

      if (token.client.id !== client.id) {
        throw new InvalidRequestError('Invalid request: refresh token is invalid');
      }

      if (token.refreshTokenExpiresAt && !(token.refreshTokenExpiresAt instanceof Date)) {
        throw new ServerError('Server error: `refreshTokenExpiresAt` must be a Date instance');
      }

      if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
        throw new InvalidRequestError('Invalid request: refresh token has expired');
      }

      return token;
    });
};

/**
 * Revoke the refresh token.
 *
 */

RevokeHandler.prototype.revokeToken = function(token) {
  return Promise.try(this.model.revokeToken, token)
    .then(function(status) {
      if (!status) {
        throw new InvalidRequestError('Invalid request: refresh token is invalid');
      }

      return token;
    });
};

/**
 * Update response when an error is thrown.
 */

RevokeHandler.prototype.updateErrorResponse = function(response, error) {
  response.body = {
    error: error.name,
    error_description: error.message
  };

  response.status = error.code;
};

/**
 * Export constructor.
 */

module.exports = RevokeHandler;
