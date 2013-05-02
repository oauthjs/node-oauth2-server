// Modules
var crypto = require('crypto'),
	OAuth2Error = require('./error');

var token = module.exports = {};

/**
 * Token endpoint
 *
 * @param  {Object}   req  Connect request
 * @param  {Object}   res  Connect response
 * @param  {Function} next Connect next
 * @return {Void}
 */
token.handle = function (req, res, next) {
	// Only POST via application/x-www-form-urlencoded is acceptable
	var contentType = (req.get('content-type') || ''),
		mime = contentType.split(';')[0];
	if (req.method !== 'POST' || mime !== 'application/x-www-form-urlencoded') {
		return next(new OAuth2Error('invalid_request',
			'Method must be POST with application/x-www-form-urlencoded encoding'));
	}

	// Grant type
	req.oauth.grantType = req.body && req.body.grant_type;
	if (!req.oauth.grantType || !req.oauth.grantType.match(this.regex.grantType)) {
		return next(new OAuth2Error('invalid_request', 'Invalid or missing grant_type parameter'));
	}

	// Extract credentials
	var creds = token.getClientCredentials(req);
	if (!creds.client_id || !creds.client_id.match(this.regex.clientId)) {
		return next(new OAuth2Error('invalid_client', 'Invalid or missing client_id parameter'));
	}

	// Check credentials against model
	var oauth = this;
	this.model.getClient(creds.client_id, creds.client_secret, function (err, client) {
		if (err) {
			return next(new OAuth2Error('server_error', false, err));
		}

		if (!client) {
			return next(new OAuth2Error('invalid_client', 'The client credentials are invalid'));
		}

		req.oauth.client = client;

		oauth.model.grantTypeAllowed(client.client_id, req.oauth.grantType, function (err, allowed) {
			if (!allowed) {
				return next(new OAuth2Error('invalid_client',
					'The grant type is unauthorised for this client_id'));
			}

			token.grant.call(oauth, req, res, next);
		});
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
token.getClientCredentials = function (req) {

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
token.grant = function (req, res, next) {

	var invalid = function () {
		next(new OAuth2Error('invalid_request',
			'Invalid grant_type parameter or parameter missing'));
	};

	var oauth = this;

	if (req.oauth.grantType.match(/^http(s|):\/\//) && this.model.extendedGrant) {
		return this.model.extendedGrant(req, function (err, supported, user) {
			if (err && err.error && err.description) {
				return next(new OAuth2Error(err.error, err.description));
			}
			if (err) return next(err);
			if (!supported) return invalid();

			if (!user || user.id === undefined) {
				return next(new OAuth2Error('invalid_request', 'Invalid request.'))
			}

			req.user = user;
			token.grantAccessToken.call(oauth, req, res, next);
		});
	}

	switch (req.oauth.grantType) {
		case 'password':
			// User credentials
			var uname = req.body.username,
				pword = req.body.password;
			if (!uname || !pword) {
				return next(new OAuth2Error('invalid_client',
					'Missing parameters. "username" and "password" are required'));
			}

			return this.model.getUser(uname, pword, function (err, user) {
				if (err) {
					return next(new OAuth2Error('server_error', false, err));
				}

				if (user) {
					req.user = user;
					token.grantAccessToken.call(oauth, req, res, next);
				} else {
					next(new OAuth2Error('invalid_grant', 'User credentials are invalid'));
				}
			});

		default:
			return invalid();
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
token.grantAccessToken = function (req, res, next) {
	var oauth = this;

	var createRefreshToken = function (err, refreshToken) {
		if (err || !refreshToken) return next(err);

		// Object indicates a reissue
		if (typeof refreshToken === 'object' && refreshToken.refresh_token) {
			req.oauth.accessToken.refresh_token = { refresh_token: refreshToken.refresh_token };
			return token.issueToken.call(oauth, req, res, next);
		}

		req.oauth.accessToken.refresh_token = refreshToken;

		var expires = new Date(oauth.now);
		expires.setSeconds(expires.getSeconds() + oauth.refreshTokenLifeTime);

		oauth.model.saveRefreshToken(req.oauth.accessToken.refresh_token,
				req.oauth.client.client_id, req.user.id, expires, function (err) {
			if (err) return next(new OAuth2Error('server_error', false, err));

			token.issueToken.call(oauth, req, res, next);
		});
	};

	var issueRefreshToken = function () {
		// Are we issuing refresh tokens?
		if (oauth.grants.indexOf('refresh_token') >= 0) {
			token.generateToken.call(oauth, 'refreshToken', req, createRefreshToken);
		} else {
			token.issueToken.call(oauth, req, res, next);
		}
	};

	var createAccessToken = function (err, accessToken) {
		if (err || !accessToken) return next(err);

		// Object idicates a reissue
		if (typeof accessToken === 'object' && accessToken.access_token) {
			req.oauth.accessToken = { access_token: accessToken.access_token };
			return issueRefreshToken();
		}

		req.oauth.accessToken = { access_token: accessToken };

		var expires = new Date(oauth.now);
		expires.setSeconds(expires.getSeconds() + oauth.accessTokenLifetime);

		oauth.model.saveAccessToken(req.oauth.accessToken.access_token, req.oauth.client.client_id,
				req.user.id, expires, function (err) {
			if (err) return next(new OAuth2Error('server_error', false, err));

			issueRefreshToken();
		});
	};

	token.generateToken.call(oauth, 'accessToken', req, createAccessToken);
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
token.issueToken = function (req, res, next) {
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
 * @param  {String}    req Connect req
 * @param  {Function}  next Connect next
 * @param  {Function}  callback
 * @return {Void}
 */
token.generateToken = function (type, req, callback) {
	if (this.model.generateToken) {
		this.model.generateToken(type, req, function (err, generatedToken) {
			if (err) return callback(new OAuth2Error('server_error'));
			if (!generatedToken) return token._generateToken(callback);
			callback(false, generatedToken);
		});
	} else {
		token._generateToken(callback);
	}
};

token._generateToken= function (callback) {
	crypto.randomBytes(256, function (ex, buffer) {
		if (ex) return callback(new OAuth2Error('server_error'));

		callback(false, crypto.createHash('sha1').update(buffer).digest('hex'));
	});
};