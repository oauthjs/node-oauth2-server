# Node OAuth2 Server [![Build Status](https://travis-ci.org/thomseddon/node-oauth2-server.png?branch=2.0)](https://travis-ci.org/thomseddon/node-oauth2-server)

Complete, compliant and well tested module for implementing an OAuth2 Server/Provider with [express](http://expressjs.com/) in [node.js](http://nodejs.org/)

## Installation

```
npm install oauth2-server
```

## Quick Start

The module provides two middlewares, one for authorization and routing, another for error handling, use them as you would any other middleware:

```js
var express = require('express'),
    bodyParser = require('body-parser'),
    oauthserver = require('oauth2-server');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.oauth = oauthserver({
  model: {}, // See below for specification
  grants: ['password'],
  debug: true
});

app.all('/oauth/token', app.oauth.grant());

app.get('/', app.oauth.authorise(), function (req, res) {
  res.send('Secret area');
});

app.use(app.oauth.errorHandler());

app.listen(3000);
```

After running with node, visting http://127.0.0.1:3000 should present you with a json response saying your access token could not be found.

Note: As no model was actually implemented here, delving any deeper, i.e. passing an access token, will just cause a server error. See below for the specification of what's required from the model.

## Features

- Supports authorization_code, password, refresh_token, client_credentials and extension (custom) grant types
- Implicitly supports any form of storage e.g. PostgreSQL, MySQL, Mongo, Redis...
- Full test suite

## Options

- *string* **model**
 - Model object (see below)
- *array* **grants**
 - grant types you wish to support, currently the module supports `authorization_code`, `password`, `refresh_token` and `client_credentials`
  - Default: `[]`
- *function|boolean* **debug**
 - If `true` errors will be  logged to console. You may also pass a custom function, in which case that function will be called with the error as its first argument
  - Default: `false`
- *number* **accessTokenLifetime**
 - Life of access tokens in seconds
 - If `null`, tokens will considered to never expire
  - Default: `3600`
- *number* **refreshTokenLifetime**
 - Life of refresh tokens in seconds
 - If `null`, tokens will considered to never expire
  - Default: `1209600`
- *number* **authCodeLifetime**
 - Life of auth codes in seconds
  - Default: `30`
- *regexp* **clientIdRegex**
 - Regex to sanity check client id against before checking model. Note: the default just matches common `client_id` structures, change as needed 
  - Default: `/^[a-z0-9-_]{3,40}$/i`
- *boolean* **passthroughErrors**
 - If true, **non grant** errors will not be handled internally (so you can ensure a consistent format with the rest of your api)
- *boolean* **continueAfterResponse**
 - If true, `next` will be called even if a response has been sent (you probably don't want this)

## Model Specification

The module requires a model object through which some aspects or storage, retrieval and custom validation are abstracted.
The last parameter of all methods is a callback of which the first parameter is always used to indicate an error.

Note: see https://github.com/thomseddon/node-oauth2-server/tree/master/examples/postgresql for a full model example using postgres.

### Always Required

#### getAccessToken (bearerToken, callback)
- *string* **bearerToken**
 - The bearer token (access token) that has been provided
- *function* **callback (error, accessToken)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *object* **accessToken**
     - The access token retrieved form storage or falsey to indicate invalid access token
     - Must contain the following keys:
         - *date* **expires**
             - The date when it expires
             - `null` to indicate the token **never expires**
         - *mixed* **user** *or* *string|number* **userId**
             - If a `user` key exists, this is saved as `req.user`
             - Otherwise a `userId` key must exist, which is saved in `req.user.id`

#### getClient (clientId, clientSecret, callback)
- *string* **clientId**
- *string|null* **clientSecret**
 - If null, omit from search query (only search by clientId)
- *function* **callback (error, client)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *object* **client**
     - The client retrieved from storage or falsey to indicate an invalid client
     - Saved in `req.client`
     - Must contain the following keys:
         - *string* **clientId**
         - *string* **redirectUri** (`authorization_code` grant type only)

#### grantTypeAllowed (clientId, grantType, callback)
- *string* **clientId**
- *string* **grantType**
- *function* **callback (error, allowed)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *boolean* **allowed**
     - Indicates whether the grantType is allowed for this clientId

#### saveAccessToken (accessToken, clientId, expires, user, callback)
- *string* **accessToken**
- *string* **clientId**
- *date* **expires**
- *object* **user**
- *function* **callback (error)**
 - *mixed* **error**
     - Truthy to indicate an error


### Required for `authorization_code` grant type

#### getAuthCode (authCode, callback)
- *string* **authCode**
- *function* **callback (error, authCode)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *object* **authCode**
     - The authorization code retrieved form storage or falsey to indicate invalid code
     - Must contain the following keys:
         - *string|number* **clientId**
             - client id associated with this auth code
         - *date* **expires**
             - The date when it expires
         - *string|number* **userId**
             - The userId

#### saveAuthCode (authCode, clientId, expires, user, callback)
- *string* **authCode**
- *string* **clientId**
- *date* **expires**
- *mixed* **user**
   - Whatever was passed as `user` to the codeGrant function (see example)
- *function* **callback (error)**
 - *mixed* **error**
     - Truthy to indicate an error


### Required for `password` grant type

#### getUser (username, password, callback)
- *string* **username**
- *string* **password**
- *function* **callback (error, user)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *object* **user**
     - The user retrieved from storage or falsey to indicate an invalid user
     - Saved in `req.user`
     - Must contain the following keys:
         - *string|number* **id**

### Required for `refresh_token` grant type

#### saveRefreshToken (refreshToken, clientId, expires, user, callback)
- *string* **refreshToken**
- *string* **clientId**
- *date* **expires**
- *object* **user**
- *function* **callback (error)**
 - *mixed* **error**
     - Truthy to indicate an error

#### getRefreshToken (refreshToken, callback)
- *string* **refreshToken**
 - The bearer token (refresh token) that has been provided
- *function* **callback (error, refreshToken)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *object* **refreshToken**
     - The refresh token retrieved form storage or falsey to indicate invalid refresh token
     - Must contain the following keys:
         - *string|number* **clientId**
             - client id associated with this token
         - *date* **expires**
             - The date when it expires
             - `null` to indicate the token **never expires**
         - *string|number* **userId**
             - The userId


### Optional for Refresh Token grant type

#### revokeRefreshToken (refreshToken, callback)
The spec does not actually require that you revoke the old token - hence this is optional (Last paragraph: http://tools.ietf.org/html/rfc6749#section-6)
- *string* **refreshToken**
- *function* **callback (error)**
 - *mixed* **error**
     - Truthy to indicate an error

### Required for [extension grant](#extension-grants) grant type

#### extendedGrant (grantType, req, callback)
- *string* **grantType**
 - The (custom) grant type
- *object* **req**
 - The raw request
- *function* **callback (error, supported, user)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *boolean* **supported**
     - Whether you support the grant type
 - *object* **user**
     - The user retrieved from storage or falsey to indicate an invalid user
     - Saved in `req.user`
     - Must contain the following keys:
         - *string|number* **id**

### Required for `client_credentials` grant type

#### getUserFromClient (clientId, clientSecret, callback)
- *string* **clientId**
- *string* **clientSecret**
- *function* **callback (error, user)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *object* **user**
     - The user retrieved from storage or falsey to indicate an invalid user
     - Saved in `req.user`
     - Must contain the following keys:
         - *string|number* **id**


### Optional

#### generateToken (type, req, callback)
- *string* **type**
 - `accessToken` or `refreshToken`
- *object* **req**
 - The current express request
- *function* **callback (error, token)**
 - *mixed* **error**
     - Truthy to indicate an error
 - *string|object|null* **token**
     - *string* indicates success
     - *null* indicates to revert to the default token generator
     - *object* indicates a reissue (i.e. will not be passed to saveAccessToken/saveRefreshToken)
         - Must contain the following keys (if object):
           - *string* **accessToken** OR **refreshToken** dependant on type

## Extension Grants
You can support extension/custom grants by implementing the extendedGrant method as outlined above.
Any grant type that is a valid URI will be passed to it for you to handle (as [defined in the spec](http://tools.ietf.org/html/rfc6749#section-4.5)).
You can access the grant type via the first argument and you should pass back supported as `false` if you do not support it to ensure a consistent (and compliant) response.

## Example using the `password` grant type

First you must insert client id/secret and user into storage. This is out of the scope of this example.

To obtain a token you should POST to `/oauth/token`. You should include your client credentials in
the Authorization header ("Basic " + client_id:client_secret base64'd), and then grant_type ("password"),
username and password in the request body, for example:

```
POST /oauth/token HTTP/1.1
Host: server.example.com
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=johndoe&password=A3ddj3w
```
This will then call the following on your model (in this order):
 - getClient (clientId, clientSecret, callback)
 - grantTypeAllowed (clientId, grantType, callback)
 - getUser (username, password, callback)
 - saveAccessToken (accessToken, clientId, expires, user, callback)
 - saveRefreshToken (refreshToken, clientId, expires, user, callback) **(if using)**

Provided there weren't any errors, this will return the following (excluding the `refresh_token` if you've not enabled the refresh_token grant type):

```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token":"2YotnFZFEjr1zCsicMWpAA",
  "token_type":"bearer",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA"
}
```

## Changelog

See: https://github.com/thomseddon/node-oauth2-server/blob/master/Changelog.md

## Credits

Copyright (c) 2013 Thom Seddon

## License

[Apache, Version 2.0](https://github.com/thomseddon/node-oauth2-server/blob/master/LICENSE)
