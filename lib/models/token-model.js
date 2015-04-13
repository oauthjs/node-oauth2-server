
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

  if (data.accessTokenExpiresOn && !(data.accessTokenExpiresOn instanceof Date)) {
    throw new InvalidArgumentError('Invalid parameter: `accessTokenExpiresOn`');
  }

  if (data.refreshTokenExpiresOn && !(data.refreshTokenExpiresOn instanceof Date)) {
    throw new InvalidArgumentError('Invalid parameter: `refreshTokenExpiresOn`');
  }

  this.accessToken = data.accessToken;
  this.accessTokenExpiresOn = data.accessTokenExpiresOn;
  this.client = data.client;
  this.refreshToken = data.refreshToken;
  this.refreshTokenExpiresOn = data.refreshTokenExpiresOn;
  this.scope = data.scope;
  this.user = data.user;
}

/**
 * Export constructor.
 */

module.exports = TokenModel;
