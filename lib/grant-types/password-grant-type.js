
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var InvalidGrantError = require('../errors/invalid-grant-error');
var InvalidRequestError = require('../errors/invalid-request-error');
var Promise = require('bluebird');
var ServerError = require('../errors/server-error');
var is = require('../validator/is');

/**
 * Constructor.
 */

function PasswordGrantType(model) {
  if (!model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  if (!model.getUser) {
    throw new ServerError('Server error: model does not implement `getUser()`');
  }

  this.model = model;
}

/**
 * Retrieve the user from the model using a username/password combination.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-4.3.2)
 */

PasswordGrantType.prototype.handle = function(request) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!request.body.username) {
    return Promise.reject(new InvalidRequestError('Missing parameter: `username`'));
  }

  if (!request.body.password) {
    return Promise.reject(new InvalidRequestError('Missing parameter: `password`'));
  }

  if (!is.uchar(request.body.username)) {
    return Promise.reject(new InvalidRequestError('Invalid parameter: `username`'));
  }

  if (!is.uchar(request.body.password)) {
    return Promise.reject(new InvalidRequestError('Invalid parameter: `password`'));
  }

  return Promise.try(this.model.getUser, [request.body.username, request.body.password])
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

module.exports = PasswordGrantType;
