
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidGrantError = require('../errors/invalid-grant-error');
var Promise = require('bluebird');
var ServerError = require('../errors/server-error');

/**
 * Constructor.
 */

function ClientCredentialsType(model) {
  if (!model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!model.getUserFromClient) {
    throw new ServerError('Server error: model does not implement `getUserFromClient()`');
  }

  this.model = model;
}

/**
 * Retrieve the user from the model using client credentials.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-4.4.2)
 */

ClientCredentialsType.prototype.handle = function(request, client) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  return Promise.try(this.model.getUserFromClient, client)
    .then(function(user) {
      if (!user) {
        throw new InvalidGrantError('Invalid grant: user credentials are invalid');
      }

      return user;
    });
};

/**
 * Export constructor.
 */

module.exports = ClientCredentialsType;
