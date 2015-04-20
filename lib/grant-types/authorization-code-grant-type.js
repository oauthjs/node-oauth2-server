
/**
 * Module dependencies.
 */

var AbstractGrantType = require('./abstract-grant-type');
var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidGrantError = require('../errors/invalid-grant-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var Promise = require('bluebird');
var ServerError = require('../errors/server-error');
var is = require('../validator/is');
var util = require('util');

/**
 * Constructor.
 */

function AuthCodeGrantType(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getAuthCode) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getAuthCode()`');
  }

  if (!options.model.revokeAuthCode) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `revokeAuthCode()`');
  }

  if (!options.model.saveToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
  }

  AbstractGrantType.call(this, options);
}

/**
 * Inherit prototype.
 */

util.inherits(AuthCodeGrantType, AbstractGrantType);

/**
 * Handle authorization code grant.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */

AuthCodeGrantType.prototype.handle = function(request, client) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  return Promise.bind(this)
    .then(function() {
      return this.getAuthCode(request, client);
    })
    .tap(function(code) {
      return this.revokeAuthCode(code);
    })
    .then(function(code) {
      return this.saveToken(code.user, client, code.authCode, code.scope);
    });
};

/**
 * Get the authorization code.
 */

AuthCodeGrantType.prototype.getAuthCode = function(request, client) {
  if (!request.body.code) {
    return Promise.reject(new InvalidRequestError('Missing parameter: `code`'));
  }

  if (!is.vschar(request.body.code)) {
    return Promise.reject(new InvalidRequestError('Invalid parameter: `code`'));
  }

  return Promise.try(this.model.getAuthCode, request.body.code)
    .then(function(authCode) {
      if (!authCode) {
        throw new InvalidGrantError('Invalid grant: authorization code is invalid');
      }

      if (!authCode.client) {
        throw new ServerError('Server error: `getAuthCode()` did not return a `client` object');
      }

      if (!authCode.user) {
        throw new ServerError('Server error: `getAuthCode()` did not return a `user` object');
      }

      if (authCode.client.id !== client.id) {
        throw new InvalidGrantError('Invalid grant: authorization code is invalid');
      }

      if (!(authCode.expiresAt instanceof Date)) {
        throw new ServerError('Server error: `expiresAt` must be a Date instance');
      }

      if (authCode.expiresAt < new Date()) {
        throw new InvalidGrantError('Invalid grant: authorization code has expired');
      }

      return authCode;
    });
};

/**
 * Revoke the authorization code.
 *
 * "The authorization code MUST expire shortly after it is issued to mitigate
 * the risk of leaks. [...] If an authorization code is used more than once,
 * the authorization server MUST deny the request."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2
 */

AuthCodeGrantType.prototype.revokeAuthCode = Promise.method(function(authCode) {
  return Promise.try(this.model.revokeAuthCode, authCode)
    .then(function(authCode) {
      if (!authCode) {
        throw new InvalidGrantError('Invalid grant: authorization code is invalid');
      }

      if (!(authCode.expiresAt instanceof Date)) {
        throw new ServerError('Server error: `expiresAt` must be a Date instance');
      }

      if (authCode.expiresAt >= new Date()) {
        throw new ServerError('Server error: authorization code should be expired');
      }

      return authCode;
    });
});

/**
 * Save token.
 */

AuthCodeGrantType.prototype.saveToken = function(user, client, authCode, scope) {
  return this.generateAccessToken()
    .bind(this)
    .then(function(accessToken) {
      var token = {
        accessToken: accessToken,
        authCode: authCode,
        scope: scope
      };

      return this.model.saveToken(token, client, user);
    });
};

/**
 * Export constructor.
 */

module.exports = AuthCodeGrantType;
