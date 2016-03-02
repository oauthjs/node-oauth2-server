
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');

/**
 * Constructor.
 */

function TokenModel(data) {
  data = data || {};

  if (!data.accessToken) {
    throw new InvalidArgumentError('Missing parameter: `accessToken`');
  }

  if (!data.client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  if (!data.user) {
    throw new InvalidArgumentError('Missing parameter: `user`');
  }

  if (data.accessTokenExpiresAt && !(data.accessTokenExpiresAt instanceof Date)) {
    throw new InvalidArgumentError('Invalid parameter: `accessTokenExpiresAt`');
  }

  if (data.refreshTokenExpiresAt && !(data.refreshTokenExpiresAt instanceof Date)) {
    throw new InvalidArgumentError('Invalid parameter: `refreshTokenExpiresAt`');
  }

  this.accessToken = data.accessToken;
  this.accessTokenExpiresAt = data.accessTokenExpiresAt;
  this.client = data.client;
  this.refreshToken = data.refreshToken;
  this.refreshTokenExpiresAt = data.refreshTokenExpiresAt;
  this.scope = data.scope;
  this.user = data.user;
}

/**
 * Export constructor.
 */

module.exports = TokenModel;
