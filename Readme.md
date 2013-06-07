# Node OAuth2 Server [![Build Status](https://travis-ci.org/nightworld/node-oauth2-server.png?branch=master)](https://travis-ci.org/nightworld/node-oauth2-server)

Complete, compliant and well tested module for implementing an OAuth2 Server/Provider with [express](http://expressjs.com/) in [node.js](http://nodejs.org/)

## Installation

	$ npm install node-oauth2-server

## Quick Start

The module provides two middlewares, one for authorization and routing, another for error handling, use them as you would any other middleware:

```js
var express = require('express'),
	oauthserver = require('node-oauth2-server');

var app = express();

app.configure(function() {
	var oauth = oauthserver({
		model: {}, // See below for specification
		grants: ['password'],
		debug: true
	});
	app.use(express.bodyParser()); // REQUIRED
	app.use(oauth.handler());
	app.use(oauth.errorHandler());
});

app.get('/', function (req, res) {
	res.send('Secret area');
});

app.listen(3000);
```

After running with node, visting http://127.0.0.1:3000 should present you with a json response saying your access token could not be found.

Note: As no model was actually implemented here, delving any deeper, i.e. passing an access token, will just cause a server error. See below for the specification of what's required from the model.

See: https://github.com/nightworld/node-oauth2-server/tree/master/examples/postgresql for a full examply using postgres.

## Features

- Supports password and extension (custom) grant types
- Implicitly supports any form of storage e.g. PostgreSQL, MySQL, Mongo, Redis...
- Full test suite

## Limitations

- Does not yet support authorization code or refresh_token grant types

## Options

- `model`	`Object`	Model object (see below)
- `allow`	`Array|Object`	Either an array (`['/path1', '/path2']`) or objects or arrays keyed by method (`{ get: ['/path1'], post: ['/path2'], all: ['/path3'] }`) of paths to allow to bypass authorisation. (Does not currently support regex)
- `grants`	`Array`	grant types you wish to support, currently the module only supports `password`
- `debug`	`Boolean` Whether to log errors to console
- `passthroughErrors`	`Boolean`	If true, **non grant** errors will not be handled internally (so you can ensure a consistent format with the rest of your api)
- `accessTokenLifetime`	`Number`	Life of access tokens in seconds (defaults to 3600)
- `refreshTokenLifetime` `Number`	Life of refresh tokens in seconds (defaults to 1209600)
- `authCodeLifetime`	`Number`	Lfe of auth codes in seconds (defaults to 30)
- `clientIdRegex`	`RegExp`	Regex to match auth codes against before checking model

## Model Specification

The module requires a model object through which some aspects or storage, retrieval and custom validation are abstracted.
The last parameter of all methods is a callback of which the first parameter is always used to indicate an error.
A model must provide the following methods:

### Required

### getAccessToken(bearerToken, callback)
- `bearerToken`	`String`	The bearer token (access token) that has been provided
- `callback`	`Function` callback(error, accessToken)
	- `error`	`Mixed`	Truthy to indicate an error
	- `accessToken`	Object|Boolean	The access token retrieved form storage or falsey to indicate invalid access token

`accessToken` should, at least, take the form:
- `expires` `Date`	The date when it expires
- `user_id` `String|Number`	The user_id (saved in req.user.id)

### getClient(clientId, clientSecret, callback)
- `clientId`	`String`
- `clientSecret`	`String`
- `callback`	`Function` callback(error, client)
	- `error`	`Mixed`	Truthy to indicate an error
	- `client`	`Object|Boolean`	The client retrieved from storage or falsey to indicate an invalid client (saved in req.client)

`client` should, at least, take the form:

- `client_id` `String` Client id

### grantTypeAllowed(clientId, grantType, callback)
- `clientId`	`String`
- `grantType`	`String`
- `callback`	`Function` callback(error, allowed)
	- `error`	`Mixed`	Truthy to indicate an error
	- `allowed`	`Boolean`	Indicates whether the grantType is allowed for this clientId

### saveAccessToken(accessToken, clientId, userId, expires, callback)
- `accessToken` `String`
- `clientId`	`String`
- `userId`	`Mixed`
- `expires`	`Date`
- `callback`	`Function` callback(error)
	- `error`	`Mixed`	Truthy to indicate an error

### saveRefreshToken(refreshToken, clientId, userId, expires, callback)
- `refreshToken` `String`
- `clientId`	`String`
- `userId`	`Mixed`
- `expires`	`Date`
- `callback`	`Function` callback(error)
	- `error`	`Mixed`	Truthy to indicate an error

### getUser(username, password, callback)
used only when granting tokens using password grant type
- `username`	`String`
- `password`	`String`
- `callback`	`Function` callback(error, user)
	- `error`	`Mixed`	Truthy to indicate an error
	- `user`	`Object|Boolean`	The user retrieved from storage or falsey to indicate an invalid user


### Optional

### extendedGrant(req, callback)
- `req`			`Object` The raw request
- `callback`	`Function` callback(error, supported, user)
	- `error`	`Mixed`	Truthy to indicate an error
	- `supported`	`Boolean`	Whether the grant type is supported
	- `user`	`Object|Boolean`	The user retrieved from storage or falsey to indicate an invalid user (saved in req.user), must at least have an id

### generateToken(type, callback)
- `type`		`String` Token type, one of 'accessToken' or 'refreshToken'
- `callback`	`Function` callback(error, token)
	- `error`	`Mixed`	Truthy to indicate an error
	- `token`	`String|Object|Null` String accessToken to indicate success, Object to indicate reissue (i.e. will not be passed on save*Token()) or Null to revert to the default token generator

## Extension Grants
You can support extension/custom grants by implementing the extendedGrant method as outlined above.
Any requests that begin with http(s):// (as [defined in the spec](http://tools.ietf.org/html/rfc6749#section-4.5)) will be passed to it for you to handle.
You can access the grant type via req.oauth.grantType and you should pass back supported as `false` if you do not support it to ensure a consistent (and compliant) response.

## Credits

Copyright (c) 2013 NightWorld

Created by Thom Seddon

## License

[Apache, Version 2.0](https://github.com/nightworld/node-oauth2-server/blob/master/LICENSE)
