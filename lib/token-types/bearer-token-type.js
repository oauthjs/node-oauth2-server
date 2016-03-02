
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');

/**
 * Constructor.
 */

function BearerTokenType(accessToken, accessTokenLifetime, refreshToken, scope) {
  if (!accessToken) {
    throw new InvalidArgumentError('Missing parameter: `accessToken`');
  }

  this.accessToken = accessToken;
  this.accessTokenLifetime = accessTokenLifetime;
  this.refreshToken = refreshToken;
  this.scope = scope;
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

  if (this.scope) {
    object.scope = this.scope;
  }

  return object;
};

/**
 * Export constructor.
 */

module.exports = BearerTokenType;
