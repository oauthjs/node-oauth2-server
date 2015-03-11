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
  runner = require('./runner');

module.exports = Scope;

/**
 * This is the function order used by the runner
 *
 * @type {Array}
 */
var fns = [
  checkScope
];

/**
 * Scope
 *
 * @param {Object}   config Instance of OAuth object
 * @param {Object}   req
 * @param {Function} next
 * @param {Mixed}    requiredScope String or list of scope keys required
 *                                 to access the resource
 */
function Scope (config, req, next, requiredScope) {
  this.config = config;
  this.model = config.model;
  this.req = req;
  this.requiredScope = requiredScope;

  runner(fns, this, next);
}

/**
 * Check scope
 *
 * Passes the access token and required scope key(s) to the model
 * for access validation. Bad requests are rejected with an
 * invalid_scope error.
 *
 * @param {Function} done
 *
 */
function checkScope (done) {
  this.model.checkScope(this.requiredScope,
      this.req.oauth.bearerToken, function (err) {
    if (err) { return done(new error('invalid_scope', err)); }
    done();
  });
}
