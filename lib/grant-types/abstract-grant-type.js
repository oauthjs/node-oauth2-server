
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var Promise = require('bluebird');
var is = require('../validator/is');
var tokenUtil = require('../utils/token-util');

/**
 * Constructor.
 */

function AbstractGrantType(options) {
  options = options || {};

  if (!options.accessTokenLifetime) {
    throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
  }

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  this.accessTokenLifetime = options.accessTokenLifetime;
  this.model = options.model;
  this.refreshTokenLifetime = options.refreshTokenLifetime;
}

/**
 * Generate access token.
 */

AbstractGrantType.prototype.generateAccessToken = Promise.method(function() {
  if (this.model.generateAccessToken) {
    return this.model.generateAccessToken();
  }

  return tokenUtil.generateRandomToken();
});

/**
 * Generate refresh token.
 */

AbstractGrantType.prototype.generateRefreshToken = Promise.method(function() {
  if (this.model.generateRefreshToken) {
    return this.model.generateRefreshToken();
  }

  return tokenUtil.generateRandomToken();
});

/**
 * Get access token expires on.
 */

AbstractGrantType.prototype.getAccessTokenExpiresAt = function() {
  var expires = new Date();

  expires.setSeconds(expires.getSeconds() + this.accessTokenLifetime);

  return expires;
};

/**
 * Get refresh token expires on.
 */

AbstractGrantType.prototype.getRefreshTokenExpiresAt = function() {
  var expires = new Date();

  expires.setSeconds(expires.getSeconds() + this.refreshTokenLifetime);

  return expires;
};

/**
 * Get scope from the request body.
 */

AbstractGrantType.prototype.getScope = function(request) {
  if (!is.nqschar(request.body.scope)) {
    throw new InvalidArgumentError('Invalid parameter: `scope`');
  }

  return request.body.scope;
};

/**
 * Export constructor.
 */

module.exports = AbstractGrantType;
