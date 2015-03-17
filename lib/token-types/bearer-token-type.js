
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');

/**
 * Constructor.
 */

function BearerTokenType(accessToken, accessTokenLifetime, refreshToken) {
  if (!accessToken) {
    throw new InvalidArgumentError('Missing parameter: `accessToken`');
  }

  if (!accessTokenLifetime) {
    throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
  }

  this.accessToken = accessToken;
  this.accessTokenLifetime = accessTokenLifetime;
  this.refreshToken = refreshToken;
}

/**
 * Retrieve the value representation.
 */

BearerTokenType.prototype.valueOf = function() {
  var object = {
    access_token: this.accessToken,
    token_type: 'bearer'
  };

  if (this.accessTokenLifetime) {
    object.expires_in = this.accessTokenLifetime;
  }

  if (this.refreshToken) {
    object.refresh_token = this.refreshToken;
  }

  return object;
};

/**
 * Export constructor.
 */

module.exports = BearerTokenType;
