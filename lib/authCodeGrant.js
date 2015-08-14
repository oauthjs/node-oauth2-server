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
  runner = require('./runner'),
  token = require('./token');

module.exports = AuthCodeGrant;

/**
 * This is the function order used by the runner for responseType Code
 *
 * @type {Array}
 */
var codeFns = [
  checkParams,
  checkClient,
  checkUserApproved,
  generateCode,
  saveAuthCode,
  redirect
];

/**
 * This is the function order used by the runner for responseType Token
 *
 * @type {Array}
 */
var tokenFns = [
  checkParams,
  checkClient,
  checkUserApproved,
  generateAccessToken,
  saveAccessToken,
  redirect
];

/**
 * AuthCodeGrant
 *
 * @param {Object}   config Instance of OAuth object
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
function AuthCodeGrant(config, req, res, next, check) {
  this.config = config;
  this.model = config.model;
  this.req = req;
  this.res = res;
  this.check = check;
  this.responseType = this.req.body.response_type || this.req.query.response_type;

  var self = this;

  var fns = this.responseType === 'code' ? codeFns : tokenFns;
  runner(fns, this, function (err) {
    if (err && res.oauthRedirect) {
      // Custom redirect error handler
      res.redirect(self.client.redirectUri + '?error=' + err.error +
        '&error_description=' + err.error_description + '&code=' + err.code);

      return self.config.continueAfterResponse ? next() : null;
    }

    next(err);
  });
}

/**
 * Check Request Params
 *
 * @param  {Function} done
 * @this   OAuth
 */
function checkParams (done) {
  var body = this.req.body;
  var query = this.req.query;
  var allowedResponseTypes = [ 'code' ];
  if(this.config.implicitEnabled) {
    allowedResponseTypes.push('token');
  }
  if (!body && !query) return done(error('invalid_request'));

  if (allowedResponseTypes.indexOf(this.responseType) === -1) {
    return done(error('invalid_request',
      'Invalid response_type parameter (must be "' + allowedResponseTypes.join('" or "') + '")'));
  }

  // Client
  this.clientId = body.client_id || query.client_id;
  if (!this.clientId) {
    return done(error('invalid_request',
      'Invalid or missing client_id parameter'));
  }

  // Redirect URI
  this.redirectUri = body.redirect_uri || query.redirect_uri;
  if (!this.redirectUri) {
    return done(error('invalid_request',
      'Invalid or missing redirect_uri parameter'));
  }

  done();
}

/**
 * Check client against model
 *
 * @param  {Function} done
 * @this   OAuth
 */
function checkClient (done) {
  var self = this;
  this.model.getClient(this.clientId, null, function (err, client) {
    if (err) return done(error('server_error', false, err));

    if (!client) {
      return done(error('invalid_client', 'Invalid client credentials'));
    } else if (Array.isArray(client.redirectUri)) {
      if (client.redirectUri.indexOf(self.redirectUri) === -1) {
        return done(error('invalid_request', 'redirect_uri does not match'));
      }
      client.redirectUri = self.redirectUri;
    } else if (client.redirectUri !== self.redirectUri) {
      return done(error('invalid_request', 'redirect_uri does not match'));
    }

    // The request contains valid params so any errors after this point
    // are redirected to the redirect_uri
    self.res.oauthRedirect = true;
    self.client = client;

    done();
  });
}

/**
 * Check client against model
 *
 * @param  {Function} done
 * @this   OAuth
 */
function checkUserApproved (done) {
  var self = this;
  this.check(this.req, function (err, allowed, user) {
    if (err) return done(error('server_error', false, err));

    if (!allowed) {
      return done(error('access_denied',
        'The user denied access to your application'));
    }

    self.user = user;
    done();
  });
}

/**
 * Check client against model
 *
 * @param  {Function} done
 * @this   OAuth
 */
function generateCode (done) {
  var self = this;
  token(this, 'authorization_code', function (err, code) {
    self.authCode = code;
    done(err);
  });
}

/**
 * Generate an access token
 *
 * @param  {Function} done
 * @this   OAuth
 */
function generateAccessToken (done) {
  var self = this;
  token(this, 'accessToken', function (err, token) {
    self.accessToken = token;
    done(err);
  });
}

/**
 * Check client against model
 *
 * @param  {Function} done
 * @this   OAuth
 */
function saveAuthCode (done) {
  var expires = new Date();
  expires.setSeconds(expires.getSeconds() + this.config.authCodeLifetime);

  this.model.saveAuthCode(this.authCode, this.client.clientId, expires,
      this.user, function (err) {
    if (err) return done(error('server_error', false, err));
    done();
  });
}

/**
 * Save access token with model
 *
 * @param  {Function} done
 * @this   OAuth
 */
function saveAccessToken (done) {
  var accessToken = this.accessToken;

  // Object idicates a reissue
  if (typeof accessToken === 'object' && accessToken.accessToken) {
    this.accessToken = accessToken.accessToken;
    return done();
  }

  var expires = null;
  if (this.config.accessTokenLifetime !== null) {
    expires = new Date();
    expires.setSeconds(expires.getSeconds() + this.config.accessTokenLifetime);
  }

  this.model.saveAccessToken(accessToken, this.client.clientId, expires,
      this.user, function (err) {
    if (err) return done(error('server_error', false, err));
    done();
  });
}

/**
 * Check client against model
 *
 * @param  {Function} done
 * @this   OAuth
 */
function redirect (done) {
  var url,
    state;

  if(this.responseType === 'code') {
    url = this.client.redirectUri + '?code=' + this.authCode;
  } else {
    url = this.client.redirectUri + '#token=' + this.accessToken;
  }

  if(typeof this.req.body.state !== 'undefined') {
    state = this.req.body.state;
  } else if(typeof this.req.query.state !== 'undefined') {
    state = this.req.query.state;
  }


  this.res.redirect(url + (state ? '&state=' + state : ''));

  if (this.config.continueAfterResponse)
    return done();
}
