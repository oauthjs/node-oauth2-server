'use strict';

/**
 * Module dependencies.
 */

var AbstractGrantType = require('./abstract-grant-type');
var InvalidArgumentError = require('../errors/invalid-argument-error');
var Promise = require('bluebird');
var promisify = require('promisify-any').use(Promise);
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

  return Promise.bind(this)
    .then(function() {
      return this.validateScope(this.user, client, this.scope);
    })
    .then(function(validated) {
      this.scope = validated;
      return this.saveToken(this.user, client, this.scope);
    });
};

/**
 * Save token.
 */

ImplicitGrantType.prototype.saveToken = function(user, client, scope) {
  var fns = [
    this.generateAccessToken(client, user, scope),
    this.getAccessTokenExpiresAt()
  ];

  return Promise.all(fns)
    .bind(this)
    .spread(function(accessToken, accessTokenExpiresAt) {
      var token = {
        accessToken: accessToken,
        accessTokenExpiresAt: accessTokenExpiresAt,
        scope: scope
      };

      return promisify(this.model.saveToken, 3).call(this.model, token, client, user);
    });
};

/**
 * Export constructor.
 */

module.exports = ImplicitGrantType;
