'use strict';

/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidScopeError = require('../errors/invalid-scope-error');
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

AbstractGrantType.prototype.generateAccessToken = function() {
  if (this.model.generateAccessToken) {
    return Promise.try(this.model.generateAccessToken);
  }

  return tokenUtil.generateRandomToken();
};

/**
 * Generate refresh token.
 */

AbstractGrantType.prototype.generateRefreshToken = function() {
  if (this.model.generateRefreshToken) {
    return Promise.try(this.model.generateRefreshToken);
  }

  return tokenUtil.generateRandomToken();
};

/**
 * Get access token expiration date.
 */

AbstractGrantType.prototype.getAccessTokenExpiresAt = function() {
  var expires = new Date();

  expires.setSeconds(expires.getSeconds() + this.accessTokenLifetime);

  return expires;
};

/**
 * Get refresh token expiration date.
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
 * Validate requested scope.
 */
AbstractGrantType.prototype.validateScope = function(user, client, scope) {
  return Promise.try(this.model.validateScope, [user, client, scope])
    .then(function(scope) {
      if(!scope) {
        throw new InvalidScopeError('Invalid scope: Requested scope is invalid');
      }

      return scope;
    });
};

/**
 * Export constructor.
 */

module.exports = AbstractGrantType;
