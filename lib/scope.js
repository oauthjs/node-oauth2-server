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
 * @param {Mixed}    scope String or list of required scopes
 */
function Scope (config, req, next, scope) {
  this.config = config;
  this.model = config.model;
  this.req = req;
  this.scope = scope;

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
  if (!this.req.oauth) return done(error('invalid_request', 'Request not authenticated'));

  this.model.authoriseScope(this.req.oauth.bearerToken, this.scope, function (err, invalid) {
    if (err) return done(error('server_error', false, err));
    if (invalid) return done(error('invalid_scope', invalid));

    done();
  });
}
