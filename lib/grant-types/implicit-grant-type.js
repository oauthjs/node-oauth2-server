'use strict';

/**
 * Module dependencies.
 */

var AbstractGrantType = require('./abstract-grant-type');
var InvalidArgumentError = require('../errors/invalid-argument-error');
var Promise = require('bluebird');
var util = require('util');

/**
 * Constructor.
 */

function ImplicitGrantType(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.saveToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
  }

  if (!options.user) {
    throw new InvalidArgumentError('Missing parameter: `user`');
  }

  this.scope = options.scope;
  this.user = options.user;

  AbstractGrantType.call(this, options);
}

/**
 * Inherit prototype.
 */

util.inherits(ImplicitGrantType, AbstractGrantType);

/**
 * Handle implicit token grant.
 */

ImplicitGrantType.prototype.handle = function(request, client) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  return this.saveToken(this.user, client, this.scope);
};

/**
 * Save token.
 */

ImplicitGrantType.prototype.saveToken = function(user, client, scope) {
  var fns = [
    this.validateScope(user, client, scope),
    this.generateAccessToken(client, user, scope),
    this.getAccessTokenExpiresAt()
  ];

  return Promise.all(fns)
    .bind(this)
    .spread(function(scope, accessToken, accessTokenExpiresAt) {
      var token = {
        accessToken: accessToken,
        accessTokenExpiresAt: accessTokenExpiresAt,
        scope: scope
      };

      return this.model.saveToken(token, client, user);
    });
};

/**
 * Export constructor.
 */

module.exports = ImplicitGrantType;
