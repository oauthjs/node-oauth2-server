// Required modules
var crypto = require('crypto');

// Expose
module.exports = OAuth2Server;

/**
 * HTTP response codes
 *
 * @type {Object}
 */
var HTTP = {
	BAD_REQUEST: 400,
	UNAUTHORISED: 401,
	FORBIDDEN: 403,
	UNAVAILABLE: 503
};

var regex = {
	clientId: /^[a-z0-9-_]{3,40}$/i,
	grantType: null
};

/**
 * Error
 *
 * @param {Number} code        Numeric error code
 * @param {String} error       Error descripton
 * @param {String} description Full error description
 */
function OAuth2Error (code, error, description, err) {
	this.code = code;
	this.error = error;
	this.error_description = description || error;
	this.stack = (err && err.stack) || err;
};

/**
 * Constructor
 *
 * @param {Object|Void} config Configuration object
 */
function OAuth2Server (config) {
	config = config || {};

	if (!config.model) throw new Error('No model supplied to OAuth2Server');
	this.model = config.model;

	this.allow = config.allow || [];
	this.grants = config.grants || [];
	this.debug = config.debug || false;

	this.accessTokenLifetime = config.accessTokenLifetime || 3600;
	this.refreshTokenLifeTime = config.refreshTokenLifeTime || 1209600;
	this.authCodeLifetime = config.authCodeLifetime || 30;
	this.now = new Date();

	regex.clientId = config.clientIdRegex || regex.clientId;
	regex.grantType = new RegExp('^(' + this.grants.join('|') + ')$', 'i');
};

/**
 * Authorise incoming requests
 *
 * Passes oauth authorization/token requests to relevant
 * handlers or, if it isn't allowed, passes it on to the
 * authorization handler
 *
 * @return {Function} Main oauth handler function
 */
OAuth2Server.prototype.handle = function () {
	var allowed = this.allow,
		oauth = this;

	var handler = function (req, res, next) {
		var allow = [],
			method;

		// Convert allow object into array for this method
		if (allowed instanceof Array) {
			allow = allowed;
		} else {
			allow = allow.concat(allowed['all'] || []);
			allow = allow.concat(allowed[req.method.toLowerCase()] || []);
		}

		if (req.path === '/oauth/token') {
			method = 'token';
		} else if (!allow.length || !req.path.match(new RegExp('^(' + allow.join('|') + ')$'))) {
			method = 'authorizeRequest';
		} else {
			return next();
		}

		// Setup request params
		req.oauth = {};

		oauth[method].apply(oauth, arguments);
	};

	var errorHandler = function (err, req, res, next) {
		if (!(err instanceof OAuth2Error)) {
			err = new OAuth2Error(HTTP.UNAVAILABLE, 'server_error', false, err);
		}

		if (oauth.debug) console.log(err.stack || err);
		delete err.stack;

		res.send(err.code, err);
	};

	return [handler, errorHandler];
}

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
OAuth2Server.prototype.authorizeRequest = function (req, res, next) {

	var validateAccessToken = function (token) {
		if (!token) {
			return next(new OAuth2Error(HTTP.UNAUTHORISED, 'invalid_grant',
				'The access token provided is invalid.'
			));
		}

		// Check it's valid
		if (!token.expires || token.expires < this.now) {
			return next(new OAuth2Error(HTTP.UNAUTHORISED, 'invalid_grant',
				'The access token provided has expired.'
			));
		}

		// Expose params
		req.user = { id: token.user_id };

		next(); // Exit point
	}

	// Get token
	var oauth = this;
	this.getBearerToken(req, function (err, bearerToken) {
		if (err) return next(err);

		oauth.model.getAccessToken(bearerToken, function (err, token) {
			if (err) {
				return next(new OAuth2Error(HTTP.UNAVAILABLE, 'server_error', false, err));
			}

			validateAccessToken(token);
		});
	});
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
OAuth2Server.prototype.getBearerToken = function (req, next) {

	var headerToken = req.get('Authorization'),
		getToken =  req.query.access_token,
		postToken = req.body.access_token;

	// Check exactly one method was used
	var methodsUsed = (typeof headerToken !== 'undefined') + (typeof getToken !== 'undefined')
		+ (typeof postToken !== 'undefined');

	if (methodsUsed > 1) {
		return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_request',
			'Only one method may be used to authenticate at a time (Auth header, GET or POST).'
		));
	} else if (methodsUsed === 0) {
		return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_request',
			'The access token was not found'
		));
	}

	// Header
	if (headerToken) {
		var matches = headerToken.match(/Bearer\s(\S+)/);

		if (!matches) {
			return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_request',
				'Malformed auth header'
			));
		}

		headerToken = matches[1];
	}

	// POST
	if (postToken) {
		if (req.method !== 'POST') {
			return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_request',
				'When putting the token in the body, the method must be POST.'
			));
		}

		// Is json etc accepted in spec?
	}

	return next(null, headerToken || postToken || getToken);
};

/**
 * Token endpoint
 *
 * @param  {Object}   req  Connect request
 * @param  {Object}   res  Connect response
 * @param  {Function} next Connect next
 * @return {Void}
 */
OAuth2Server.prototype.token = function (req, res, next) {
	// Only POST via application/x-www-form-urlencoded is acceptable
	var contentType = (req.get('content-type') || ''),
		mime = contentType.split(';')[0];
	if (req.method !== 'POST' || mime !== 'application/x-www-form-urlencoded') {
		return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_request',
			'Method must be POST with application/x-www-form-urlencoded encoding'
		));
	}

	// Grant type
	req.oauth.grantType = req.body && req.body.grant_type;
	if (!req.oauth.grantType || !req.oauth.grantType.match(regex.grantType)) {
		return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_request',
			'Invalid or missing grant_type parameter'
		));
	}

	// Extract credentials
	var creds = this.getClientCredentials(req);
	if (!creds.client_id || !creds.client_id.match(regex.clientId)) {
		return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_client',
			'Invalid or missing client_id parameter'
		));
	}

	// Check credentials against model
	var oauth = this;
	this.model.getClient(creds.client_id, creds.client_secret, function (err, client) {
		if (err) {
			return next(new OAuth2Error(HTTP.UNAVAILABLE, 'server_error', false, err));
		}

		if (!client) {
			return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_client',
				'The client credentials are invalid'
			));
		}

		req.oauth.client = client;

		if (!oauth.model.grantTypeAllowed(client.client_id, req.oauth.grantType)) {
			return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_client',
				'The grant type is unauthorised for this client_id'
			));
		}

		oauth.grant.call(oauth, req, res, next);
	});
};

/**
 * Convinience function for extracting client credentials from request
 *
 * @see OAuth2Server#token
 *
 * @param  {Object} req Connect request
 * @return {Object}     Client id/secret from headers or body
 */
OAuth2Server.prototype.getClientCredentials = function (req) {

	// Return object
	var creds = function (clientId, clientSecret) {
		this.client_id = clientId;
		this.client_secret = clientSecret;
	};

	// Check for Basic Auth
	// Pulled from Connect:
	// https://github.com/senchalabs/connect/blob/master/lib/middleware/basicAuth.js#L65
	var fromBasicAuth = function () {
		var authorization = req.get('authorization');
		if (!authorization) return false;

		var parts = authorization.split(' ');

		if (parts.length !== 2) return false;

		var scheme = parts[0],
			credentials = new Buffer(parts[1], 'base64').toString(),
			index = credentials.indexOf(':');

		if (scheme !== 'Basic' || index < 0) return false;

		return new creds(credentials.slice(0, index), credentials.slice(index + 1));
	};

	return fromBasicAuth() || new creds(req.body.client_id, req.body.client_secret);
};

/**
 * Grant access token based on grant_type
 *
 * @see OAuth2Server#token
 *
 * @param  {Object}   req  Connect request
 * @param  {Object}   res  Connect response
 * @param  {Function} next Connect next
 * @return {Void}
 */
OAuth2Server.prototype.grant = function (req, res, next) {
	switch (req.oauth.grantType) {
		case 'password':
			// User credentials
			var uname = req.body.username,
				pword = req.body.password;
			if (!uname || !pword) {
				return next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_client',
					'Missing parameters. "username" and "password" are required'
				));
			}

			var oauth = this;
			return this.model.getUser(uname, pword, function (err, user) {
				if (err) {
					return next(new OAuth2Error(HTTP.UNAVAILABLE, 'server_error', false, err));
				}

				if (user) {
					req.user = user;
					oauth.grantAccessToken.call(oauth, req, res, next);
				} else {
					next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_grant',
						'User credentials are invalid'
					));
				}
			});

			return;

		default:
			next(new OAuth2Error(HTTP.BAD_REQUEST, 'invalid_request',
				'Invalid grant_type parameter or parameter missing'
			));

	}
};

/**
 * Save access token ready for issuing
 *
 * @see OAuth2Server#grant
 *
 * @param  {Object}   req  Connect request
 * @param  {Object}   res  Connect response
 * @param  {Function} next Connect next
 * @return {Void}
 */
OAuth2Server.prototype.grantAccessToken = function (req, res, next) {
	req.oauth.accessToken = {};

	req.oauth.accessToken.access_token = this.generateToken(res);
	if (!req.oauth.accessToken.access_token) return;

	var expires = new Date(this.now);
	expires.setSeconds(expires.getSeconds() + this.accessTokenLifetime);

	var oauth = this;
	this.model.saveAccessToken(req.oauth.accessToken.access_token, req.oauth.client.client_id,
			req.user.id, expires, function (err) {
		if (err) {
			return next(new OAuth2Error(HTTP.UNAVAILABLE, 'server_error', false, err));
		}

		// Are we issuing refresh tokens?
		if (oauth.grants.indexOf('refresh_token') >= 0) {
			req.oauth.accessToken.refresh_token = oauth.generateToken(res);
			if (!req.oauth.accessToken.refresh_token) return;

			var expires = new Date(oauth.now);
			expires.setSeconds(expires.getSeconds() + oauth.refreshTokenLifeTime);

			return oauth.model.saveRefreshToken(req.oauth.accessToken.refresh_token,
					req.oauth.client.client_id, req.user.id, expires, function (err) {
				if (err) {
					return next(new OAuth2Error(HTTP.UNAVAILABLE, 'server_error', false, err));
				}

				oauth.issueToken.call(oauth, req, res, next);
			});
		}

		oauth.issueToken.call(oauth, req, res, next);
	});
};

/**
 * Actually issue the token and send the response
 *
 * @see OAuth2Server#grantAccessToken
 *
 * @param  {Object}   req  Connect request
 * @param  {Object}   res  Connect response
 * @param  {Function} next Connect next
 * @return {Void}
 */
OAuth2Server.prototype.issueToken = function (req, res, next) {
	// Prepare for output
	req.oauth.accessToken.token_type = 'bearer';
	req.oauth.accessToken.expires_in = this.accessTokenLifetime;

	// That's it!
	res.set({ 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
	res.jsonp(req.oauth.accessToken);
};

/**
 * Convinience function for generating a token
 *
 * @param  {Function} next Connect next
 * @return {String}        Random 40 char token
 */
OAuth2Server.prototype.generateToken = function (next) {
	try {
		return crypto.createHash('sha1').update(crypto.randomBytes(256)).digest('hex');
	} catch (e) {
		next(new OAuth2Error(HTTP.UNAVAILABLE, 'server_error'));
		return false;
	}
};