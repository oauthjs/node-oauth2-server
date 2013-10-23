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

var crypto = require('crypto'),
  error = require('./error');

module.exports = Token;

/**
 * Token generator that will delegate to model or
 * the internal random generator
 *
 * @param  {String}   type     'accessToken' or 'refreshToken'
 * @param  {Function} callback
 */
function Token (config, type, callback) {
  if (config.model.generateToken) {
    config.model.generateToken(type, config.req, function (err, token) {
      if (err) return callback(error('server_error', false, err));
      if (!token) return generateRandomToken(callback);
      callback(false, token);
    });
  } else {
    generateRandomToken(callback);
  }
}

/**
 * Internal random token generator
 *
 * @param  {Function} callback
 */
var generateRandomToken = function (callback) {
  crypto.randomBytes(256, function (ex, buffer) {
    if (ex) return callback(error('server_error'));

    var token = crypto
      .createHash('sha1')
      .update(buffer)
      .digest('hex');

    callback(false, token);
  });
};
