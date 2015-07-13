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

var util = require('util');

/**
 * Error
 *
 * @param {Number} code        Numeric error code
 * @param {String} error       Error descripton
 * @param {String} description Full error description
 */
function OAuth2Error (error, description, err) {
  if (!(this instanceof OAuth2Error))
    return new OAuth2Error(error, description, err);

  Error.call(this);

  this.name = this.constructor.name;
  if (err instanceof Error) {
    this.message = err.message;
    this.stack = err.stack;
  } else {
    this.message = description;
    Error.captureStackTrace(this, this.constructor);
  }

  this.headers = {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache'
  };

  switch (error) {
    case 'invalid_client':
      this.headers['WWW-Authenticate'] = 'Basic realm="Service"';
      /* falls through */
    case 'invalid_grant':
    case 'invalid_request':
      this.code = 400;
      break;
    case 'invalid_token':
      this.code = 401;
      break;
    case 'server_error':
      this.code = 503;
      break;
    default:
      this.code = 500;
  }

  this.error = error;
  this.error_description = description || error;
}

util.inherits(OAuth2Error, Error);

var obj = {
  /**
   * Expose an overload method to allow the user to override the built-in error
   * function after the package has been loaded.
   */
  configure: function(config) {
    if (config.customError && typeof config.customError === "function")
      this.error = config.customError;
  },

  error: OAuth2Error,
  _error: OAuth2Error
};

module.exports = obj;