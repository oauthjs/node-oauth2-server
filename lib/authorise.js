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

// Modules
var error = require('./error');

var authorise = module.exports = {};

/**
 * Authorise a request with OAuth2
 *
 * This is a the top level function that should be directly
 * passed into the express callback chain to authorise a request
 * against OAuth2
 *
 * @param  {Object}   req  Connect request
 * @param  {Object}   res  Connect response
 * @param  {Function} next Connect next
 * @return {Void}
 */
authorise.handle = function (req, res, next) {
	// Get token
	var oauth = this;
	authorise.getBearerToken(req, function (err, bearerToken) {
		if (err) return next(err);

		oauth.model.getAccessToken(bearerToken, function (err, token) {
			if (err) {
				return next(error('server_error', false, err));
			}

			authorise.validateAccessToken.call(oauth, token, req, next);
		});
	});
};

/**
 * Validate Access Token
 *
 * Check access token retrieved from storage is valid
 *
 * @param  {Object}   token Connect token
 * @param  {Object}   req   Connect req
 * @param  {Function} next  Connect next
 * @return {Void}
 */
authorise.validateAccessToken = function (token, req, next) {
	if (!token) {
		return next(error('invalid_token', 'The access token provided is invalid.'));
	}

	// Check it's valid
	if (token.expires !== null && (!token.expires || token.expires < this.now)) {
		return next(error('invalid_token', 'The access token provided has expired.'));
	}

	// Expose params
	req.oauth.token = token;
	req.user = token.user ? token.user : { id: token.user_id };

	next(); // Exit point
};

/**
 * Extract access token from request
 *
 * Checks exactly one access token had been passed and
 * does additional validation for each method of passing
 * the token.
 * Returns OAuth2 Error if any of the above conditions
 * aren't met.
 *
 * @see OAuth2Server#authorizeRequest
 *
 * @param  {Object}   req  Connect request
 * @return {Object|String}  Oauth2Error or The access token
 */
authorise.getBearerToken = function (req, next) {

	var headerToken = req.get('Authorization'),
		getToken =  req.query.access_token,
		postToken = req.body.access_token;

	// Check exactly one method was used
	var methodsUsed = (headerToken !== undefined) + (getToken !== undefined) +
		(postToken !== undefined);

	if (methodsUsed > 1) {
		return next(error('invalid_request',
			'Only one method may be used to authenticate at a time (Auth header, GET or POST).'));
	} else if (methodsUsed === 0) {
		return next(error('invalid_request', 'The access token was not found'));
	}

	// Header: http://tools.ietf.org/html/rfc6750#section-2.1
	if (headerToken) {
		var matches = headerToken.match(/Bearer\s(\S+)/);

		if (!matches) {
			return next(error('invalid_request', 'Malformed auth header'));
		}

		headerToken = matches[1];
	}

	// POST: http://tools.ietf.org/html/rfc6750#section-2.2
	if (postToken) {
		if (req.method === 'GET') {
			return next(error('invalid_request',
				'Method cannot be GET When putting the token in the body.'));
		}

		if (!req.is('application/x-www-form-urlencoded')) {
			return next(error('invalid_request', 'When putting the token in the body, ' +
				'content type must be application/x-www-form-urlencoded.'));
		}
	}

	return next(null, headerToken || postToken || getToken);
};