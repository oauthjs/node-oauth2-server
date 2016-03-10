'use strict';

/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../errors/invalid-argument-error');
var ImplicitGrantType = require('../grant-types/implicit-grant-type');
var Promise = require('bluebird');

/**
 * Constructor.
 */

function TokenResponseType(options) {
  options = options || {};

  if (!options.accessTokenLifetime) {
    throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
  }

  this.accessToken = null;
  this.accessTokenLifetime = options.accessTokenLifetime;
  this.model = options.model;
}

/**
 * Handle token response type.
 */

TokenResponseType.prototype.handle = function(request, client, user, uri, scope) {
  if (!request) {
    throw new InvalidArgumentError('Missing parameter: `request`');
  }

  if (!client) {
    throw new InvalidArgumentError('Missing parameter: `client`');
  }

  var accessTokenLifetime = this.getAccessTokenLifetime(client);

  var options = {
    user: user,
    scope: scope,
    model: this.model,
    accessTokenLifetime: accessTokenLifetime
  };

  var grantType = new ImplicitGrantType(options);

  return Promise.bind(this)
    .then(function() {
      return grantType.handle(request, client);
    })
    .then(function(token) {
      this.accessToken = token.accessToken;
      return token;
    });
};

/**
 * Get access token lifetime.
 */

TokenResponseType.prototype.getAccessTokenLifetime = function(client) {
  return client.accessTokenLifetime || this.accessTokenLifetime;
};

/**
 * Build redirect uri.
 */

TokenResponseType.prototype.buildRedirectUri = function(redirectUri) {
  return this.setRedirectUriParam(redirectUri, 'access_token', this.accessToken);
};

/**
 * Set redirect uri parameter.
 */

TokenResponseType.prototype.setRedirectUriParam = function(redirectUri, key, value) {
  if (!redirectUri) {
    throw new InvalidArgumentError('Missing parameter: `redirectUri`');
  }

  if (!key) {
    throw new InvalidArgumentError('Missing parameter: `key`');
  }

  redirectUri.hash = redirectUri.hash || '';
  redirectUri.hash += (redirectUri.hash ? '&' : '') + key + '=' + encodeURIComponent(value);

  return redirectUri;
};

/**
 * Export constructor.
 */

module.exports = TokenResponseType;
