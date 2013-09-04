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
  Grant = require('./grant'),
  Authorise = require('./authorise');

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

  this.allow = config.allow || [];
  this.grants = config.grants || [];
  this.debug = config.debug || false;
  this.passthroughErrors = config.passthroughErrors;

  this.accessTokenLifetime = config.accessTokenLifetime !== undefined ?
    config.accessTokenLifetime : 3600;
  this.refreshTokenLifetime = config.refreshTokenLifetime !== undefined ?
    config.refreshTokenLifetime : 1209600;
  this.authCodeLifetime = config.authCodeLifetime || 30;
  this.now = new Date();

  this.regex = {
    clientId: config.clientIdRegex || /^[a-z0-9-_]{3,40}$/i,
    grantType: new RegExp('^(' + this.grants.join('|') + ')$', 'i')
  };
};

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
    req.oauth = { internal: true };
    new Grant(self, req, res, next);
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
    if (!(err instanceof error)) return next();

    if (self.debug) console.log(err.stack || err);
    if (self.passthroughErrors && !req.oauth.internal) return next(err);

    delete err.stack;
    res.send(err.code, err);
  };
};
