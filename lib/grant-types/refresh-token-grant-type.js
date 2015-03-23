
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidGrantError = require('../errors/invalid-grant-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var Promise = require('bluebird');
var ServerError = require('../errors/server-error');
var is = require('../validator/is');

/**
 * Constructor.
 */

function RefreshTokenGrantType(model) {
  if (!model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!model.getRefreshToken) {
    throw new ServerError('Server error: model does not implement `getRefreshToken()`');
  }

  this.model = model;
}

/**
 * Retrieve the user from the model using a refresh_token.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-6)
 */

RefreshTokenGrantType.prototype.handle = function(request, client) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  if (!request.body.refresh_token) {
    return Promise.reject(new InvalidRequestError('Missing parameter: `refresh_token`'));
  }

  if (!is.vschar(request.body.refresh_token)) {
    return Promise.reject(new InvalidRequestError('Invalid parameter: `refresh_token`'));
  }

  return Promise.try(this.model.getRefreshToken, request.body.refresh_token)
    .then(function(refreshToken) {
      if (!refreshToken) {
        throw new InvalidGrantError('Invalid grant: refresh token is invalid');
      }

      if (!refreshToken.client) {
        throw new ServerError('Server error: `getRefreshToken()` did not return a `client` object');
      }

      if (!refreshToken.user) {
        throw new ServerError('Server error: `getRefreshToken()` did not return a `user` object');
      }

      if (refreshToken.client.id !== client.id) {
        throw new InvalidGrantError('Invalid grant: refresh token is invalid');
      }

      if (refreshToken.expires && !(refreshToken.expires instanceof Date)) {
        throw new ServerError('Server error: `expires` must be a Date instance');
      }

      if (refreshToken.expires && refreshToken.expires < new Date()) {
        throw new InvalidGrantError('Invalid grant: refresh token has expired');
      }

      return refreshToken;
    });
};

/**
 * Export constructor.
 */

module.exports = RefreshTokenGrantType;
