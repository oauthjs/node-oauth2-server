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

module.exports = OAuth2ErrorWrap;

/**
 * OAuth2ErrorWrap
 *
 * Wrap OAuth2Error to allow configurable type
 *
 * @param {String} type        Request type
 */
function OAuth2ErrorWrap (type) {
  return function (error, description, err) {
    return new OAuth2Error(error, description, err, type);
  }
}

/**
 * Expose OAuth2Error
 */
OAuth2ErrorWrap.OAuth2Error = OAuth2Error;

/**
 * OAuth2Error
 *
 * @param {String} error       Error descripton
 * @param {String} description Full error description
 * @param {Mixed}  err         Raw error
 * @param {String} type        Request type
 */
function OAuth2Error (error, description, err, type) {
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
    case 'invalid_grant':
    case 'invalid_request':
    case 'unauthorized_client':
    case 'unsupported_grant_type':
      this.code = 400;
      break;
    case 'invalid_client':
      this.headers['WWW-Authenticate'] = 'Basic realm="Service"';
      /* falls through */
    case 'invalid_token':
    case 'unauthorized':
      this.code = 401;
      break;
    case 'server_error':
      this.code = 503;
      break;
    default:
      this.code = 500;
  }

  if (type === 'authorise') {
    this.headers = {
      'WWW-Authenticate': 'Bearer realm="Service"'
    }

    if (error !== 'unauthorized') {
      this.headers['WWW-Authenticate'] += ',error="' + error + '"' +
        ',error_description="' + description + '"';
    }
  }

  this.error = error;
  this.error_description = description || error;
}

util.inherits(OAuth2Error, Error);
