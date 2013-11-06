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

// Required modules
var error = require('./error'),
	authorise = require('./authorise'),
	token = require('./token');

// Expose
module.exports = OAuth2Server;

/**
 * Constructor
 *
 * @param {Object|Void} config Configuration object
 */
function OAuth2Server (config) {

	if (!(this instanceof OAuth2Server)) {
		return new OAuth2Server(config);
	}

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

	this.regex = {};
	this.regex.clientId = config.clientIdRegex || /^[a-z0-9-_]{3,40}$/i;
	this.regex.grantType = new RegExp('^(' + this.grants.join('|') + ')$', 'i');
}

/**
 * Authorise incoming requests
 *
 * Provides main OAuth middleware that passes oauth
 * authorization/token requests to relevant handlers or,
 * if it isn't allowed, passes it on to the internal
 * authorization handler
 *
 * @return {Function} Main OAuth handling middleware
 */
OAuth2Server.prototype.handler = function () {
	var allowed = this.allow,
		allowedIsArray = Array.isArray(allowed),
		allowCache = allowedIsArray ? false : {},
		oauth = this;

	return function (req, res, next) {
		var method = req.method.toLowerCase(),
			allow = allowedIsArray ? allowCache : allowCache[method];

		// Build allow object this method if haven't yet already
		if (!allow) {
			var paths = allowedIsArray ? allowed :
				Array.prototype.concat(allowed.all || [], allowed[method] || []);

			allow = {
				len: paths.length,
				regex: new RegExp('^(' + paths.join('|') + ')$')
			};

			if (allowedIsArray) {
				allowCache = allow;
			} else {
				allowCache[method] = allow;
			}
		}

		// Setup request params
		req.oauth = { internal: false };
    oauth.now = new Date();

		if (req.path === '/oauth/token') {
			req.oauth.internal = true;
			return token.handle.apply(oauth, arguments);
		} else if (!allow.len || !req.path.match(allow.regex)) {
			return authorise.handle.apply(oauth, arguments);
		} else {
			return next();
		}
	};
};

/**
 * Error Handler
 *
 * Provides OAuth error handling middleware to catch any errors
 * and ensure an oauth complient response
 *
 * @return {Function} OAuth error handling middleware
 */
OAuth2Server.prototype.errorHandler = function () {
	var oauth = this;

	return function (err, req, res, next) {
		if (err instanceof Error && err.status && err.status === 400) {
			err = error('invalid_request', err.toString(), err);
		} else if (!(err instanceof error)) {
			err = error('server_error', false, err);
		}

		if (oauth.debug) console.log(err.stack || err);
		if (oauth.passthroughErrors && !req.oauth.internal) return next(err);

		delete err.stack;
		res.send(err.code, err);
	};
};