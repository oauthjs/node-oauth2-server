'use strict';

/**
 * Expose server and request/response classes.
 */

exports = module.exports = require('./lib/server');
exports.Request = require('./lib/request');
exports.Response = require('./lib/response');

/**
 * Export helpers for extension grants.
 */

exports.AbstractGrantType = require('./lib/grant-types/abstract-grant-type');

/**
 * Export error classes.
 */

exports.AccessDeniedError = require('./lib/errors/access-denied-error');
exports.InsufficientScopeError = require('./lib/errors/insufficient-scope-error');
exports.InvalidArgumentError = require('./lib/errors/invalid-argument-error');
exports.InvalidClientError = require('./lib/errors/invalid-client-error');
exports.InvalidGrantError = require('./lib/errors/invalid-grant-error');
exports.InvalidRequestError = require('./lib/errors/invalid-request-error');
exports.InvalidScopeError = require('./lib/errors/invalid-scope-error');
exports.InvalidTokenError = require('./lib/errors/invalid-token-error');
exports.OAuthError = require('./lib/errors/oauth-error');
exports.ServerError = require('./lib/errors/server-error');
exports.UnauthorizedClientError = require('./lib/errors/unauthorized-client-error');
exports.UnauthorizedRequestError = require('./lib/errors/unauthorized-request-error');
exports.UnsupportedGrantTypeError = require('./lib/errors/unsupported-grant-type-error');
exports.UnsupportedResponseTypeError = require('./lib/errors/unsupported-response-type-error');

