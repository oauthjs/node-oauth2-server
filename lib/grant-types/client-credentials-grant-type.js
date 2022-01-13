'use strict';

/**
 * Module dependencies.
 */

const AbstractGrantType = require('./abstract-grant-type');
const InvalidArgumentError = require('../errors/invalid-argument-error');
const InvalidGrantError = require('../errors/invalid-grant-error');
const Promise = require('bluebird');
const promisify = require('promisify-any').use(Promise);
const util = require('util');

/**
 * Constructor.
 */

function ClientCredentialsGrantType(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!options.model.getUserFromClient) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `getUserFromClient()`');
  }

  if (!options.model.saveToken) {
    throw new InvalidArgumentError('Invalid argument: model does not implement `saveToken()`');
  }

  AbstractGrantType.call(this, options);
}

/**
 * Inherit prototype.
 */

util.inherits(ClientCredentialsGrantType, AbstractGrantType);

/**
 * Handle client credentials grant.
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.4.2
 */

ClientCredentialsGrantType.prototype.handle = function(request, client) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  const scope = this.getScope(request);

  return Promise.bind(this)
    .then(function() {
      return this.getUserFromClient(client);
    })
    .then(function(user) {
      return this.saveToken(user, client, scope);
    });
};

/**
 * Retrieve the user using client credentials.
 */

ClientCredentialsGrantType.prototype.getUserFromClient = function(client) {
  return promisify(this.model.getUserFromClient, 1).call(this.model, client)
    .then(function(user) {
      if (!user) {
        throw new InvalidGrantError('Invalid grant: user credentials are invalid');
      }

      return user;
    });
};

/**
 * Save token.
 */

ClientCredentialsGrantType.prototype.saveToken = function(user, client, scope) {
  const fns = [
    this.validateScope(user, client, scope),
    this.generateAccessToken(client, user, scope),
    this.getAccessTokenExpiresAt(client, user, scope)
  ];

  return Promise.all(fns)
    .bind(this)
    .spread(function(scope, accessToken, accessTokenExpiresAt) {
      const token = {
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

module.exports = ClientCredentialsGrantType;
