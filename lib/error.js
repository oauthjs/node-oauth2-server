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

module.exports = OAuth2Error;

/**
 * Error
 *
 * @param {Number} code        Numeric error code
 * @param {String} error       Error descripton
 * @param {String} description Full error description
 */
function OAuth2Error (error, description, err) {

	if (!(this instanceof OAuth2Error)) return new OAuth2Error(error, description, err);

	switch (error) {
		case 'invalid_client':
		case 'invalid_grant':
		case 'invalid_request':
			this.code = 400;
			break;
		case 'server_error':
			this.code = 503;
			break;
		default:
			this.code = 500;
	}

	this.error = error;
	this.error_description = description || error;
	this.stack = (err && err.stack) || err;
}