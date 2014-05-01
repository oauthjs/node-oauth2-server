/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var error = require('./error'),
  AuthCodeGrant = require('./authCodeGrant'),
  Authorise = require('./authorise'),
  Grant = require('./grant');

module.exports = OAuth2Server;

/**
 * Constructor
 *
 * @param {Object} config Configuration object
 */
function OAuth2Server (config) {

  if (!(this instanceof OAuth2Server)) return new OAuth2Server(config);

  config = config || {};

  if (!config.model) throw new Error('No model supplied to OAuth2Server');
  this.model = config.model;

  this.grants = config.grants || [];
  this.debug = config.debug || function () {};
  if (typeof(this.debug) !== 'function') {
      this.debug = console.log;
  }
  this.passthroughErrors = config.passthroughErrors;
  this.continueAfterResponse = config.continueAfterResponse;

  this.accessTokenLifetime = config.accessTokenLifetime !== undefined ?
    config.accessTokenLifetime : 3600;
  this.refreshTokenLifetime = config.refreshTokenLifetime !== undefined ?
    config.refreshTokenLifetime : 1209600;
  this.authCodeLifetime = config.authCodeLifetime || 30;

  this.regex = {
    clientId: config.clientIdRegex || /^[a-z0-9-_]{3,40}$/i,
    grantType: new RegExp('^(' + this.grants.join('|') + ')$', 'i')
  };
}

/**
 * Authorisation Middleware
 *
 * Returns middleware that will authorise the request using oauth,
 * if successful it will allow the request to proceed to the next handler
 *
 * @return {Function} middleware
 */
OAuth2Server.prototype.authorise = function () {
  var self = this;

  return function (req, res, next) {
    new Authorise(self, req, next);
  };
};

/**
 * Grant Middleware
 *
 * Returns middleware that will grant tokens to valid requests.
 * This would normally be mounted at '/oauth/token' e.g.
 *
 * `app.all('/oauth/token', oauth.grant());`
 *
 * @return {Function} middleware
 */
OAuth2Server.prototype.grant = function () {
  var self = this;

  return function (req, res, next) {
    new Grant(self, req, res, next);
  };
};

/**
 * Code Auth Grant Middleware
 *
 * @param  {Function} check Function will be called with req to check if the
 *                          user has authorised the request.
 * @return {Function}       middleware
 */
OAuth2Server.prototype.authCodeGrant = function (check) {
  var self = this;

  return function (req, res, next) {
    new AuthCodeGrant(self, req, res, next, check);
  };
};

/**
 * OAuth Error Middleware
 *
 * Returns middleware that will catch OAuth errors and ensure an OAuth
 * complaint response
 *
 * @return {Function} middleware
 */
OAuth2Server.prototype.errorHandler = function () {
  var self = this;

  return function (err, req, res, next) {
    if (!(err instanceof error) || self.passthroughErrors) return next(err);

    self.debug(err.stack || err);
    delete err.stack;

    if (err.headers) res.set(err.headers);
    delete err.headers;

    res.send(err.code, err);
  };
};

/**
 * Lockdown
 *
 * When using the lockdown patter, this function should be called after
 * all routes have been declared.
 * It will search through each route and if it has not been explitly bypassed
 * (by passing oauth.bypass) then authorise will be inserted.
 * If oauth.grant has been passed it will replace it with the proper grant
 * middleware
 * NOTE: When using this method, you must PASS the method not CALL the method,
 * e.g.:
 *
 * `
 * app.all('/oauth/token', app.oauth.grant);
 *
 * app.get('/secrets', function (req, res) {
 *   res.send('secrets');
 * });
 *
 * app.get('/public', app.oauth.bypass, function (req, res) {
 *   res.send('publci');
 * });
 *
 * app.oauth.lockdown(app);
 * `
 *
 * @param  {Object} app Express app
 */
OAuth2Server.prototype.lockdown = function (app) {
  var self = this;

  var lockdown = function (route) {
    // Check if it's a grant route
    var pos = route.callbacks.indexOf(self.grant);
    if (pos !== -1) {
      route.callbacks[pos] = self.grant();
      return;
    }

    // Check it's not been explitly bypassed
    pos = route.callbacks.indexOf(self.bypass);
    if (pos === -1) {
      route.callbacks.unshift(self.authorise());
    } else {
      route.callbacks.splice(pos, 1);
    }
  };

  for (var method in app.routes) {
    app.routes[method].forEach(lockdown);
  }
};

/**
 * Bypass
 *
 * This is used as placeholder for when using the lockdown pattern
 *
 * @return {Function} noop
 */
OAuth2Server.prototype.bypass = function () {};
