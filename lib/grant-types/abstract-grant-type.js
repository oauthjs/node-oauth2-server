'use strict';

/**
 * Module dependencies.
 */

const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidScopeError = require('../errors/invalid-scope-error');
const Promise = require('bluebird');
const promisify = require('promisify-any').use(Promise);
const isFormat = require('@node-oauth/formats');
const tokenUtil = require('../utils/token-util');

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
  this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
}

/**
 * Generate access token.
 */

AbstractGrantType.prototype.generateAccessToken = function(client, user, scope) {
  if (this.model.generateAccessToken) {
    return promisify(this.model.generateAccessToken, 3).call(this.model, client, user, scope)
      .then(function(accessToken) {
        return accessToken || tokenUtil.generateRandomToken();
      });
  }

  return tokenUtil.generateRandomToken();
};

/**
 * Generate refresh token.
 */

AbstractGrantType.prototype.generateRefreshToken = function(client, user, scope) {
  if (this.model.generateRefreshToken) {
    return promisify(this.model.generateRefreshToken, 3).call(this.model, client, user, scope)
      .then(function(refreshToken) {
        return refreshToken || tokenUtil.generateRandomToken();
      });
  }

  return tokenUtil.generateRandomToken();
};

/**
 * Get access token expiration date.
 */

AbstractGrantType.prototype.getAccessTokenExpiresAt = function() {
  return new Date(Date.now() + this.accessTokenLifetime * 1000);
};

/**
 * Get refresh token expiration date.
 */

AbstractGrantType.prototype.getRefreshTokenExpiresAt = function() {
  return new Date(Date.now() + this.refreshTokenLifetime * 1000);
};

/**
 * Get scope from the request body.
 */

AbstractGrantType.prototype.getScope = function(request) {
  if (!isFormat.nqschar(request.body.scope)) {
    throw new InvalidArgumentError('Invalid parameter: `scope`');
  }

  return request.body.scope;
};

/**
 * Validate requested scope.
 */
AbstractGrantType.prototype.validateScope = function(user, client, scope) {
  if (this.model.validateScope) {
    return promisify(this.model.validateScope, 3).call(this.model, user, client, scope)
      .then(function (scope) {
        if (!scope) {
          throw new InvalidScopeError('Invalid scope: Requested scope is invalid');
        }

        return scope;
      });
  } else {
    return scope;
  }
};

/**
 * Export constructor.
 */

module.exports = AbstractGrantType;
