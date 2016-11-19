Complete, compliant and well tested module for implementing an OAuth2 server in [node.js](https://nodejs.org/).

  [![NPM Version][npm-image]][npm-url]
  [![Build Status][travis-image]][travis-url]
  [![NPM Downloads][downloads-image]][downloads-url]

# Quick Start

  The _node-oauth2-server_ module is framework-agnostic but there are several wrappers available for popular frameworks such as [express](https://github.com/oauthjs/express-oauth-server) and [koa 2](https://github.com/oauthjs/koa-oauth-server).

  Using the _express_ wrapper (_recommended_):

```js
var express = require('express');
var oauthServer = require('express-oauth-server');
var app = express();

var oauth = new oauthServer({ model: model });

app.use(oauth.authenticate());

app.get('/', function (req, res) {
  res.send('Hello World');
})

app.listen(3000);
```

  Using this module directly (_for custom servers only_):

```js
var Request = require('oauth2-server').Request;
var oauthServer = require('oauth2-server');

var oauth = new oauthServer({ model: model });

var request = new Request({
  headers: { authorization: 'Bearer foobar' }
});

oauth.authenticate(request)
  .then(function(data) {
    // Request is authorized.
  })
  .catch(function(e) {
    // Request is not authorized.
  });
```

  _Note: see the documentation for the [specification][wiki-model-specification] of what's required from the model._

# Features

  - Supports `authorization_code` (with scopes), `client_credentials`, `password`, `refresh_token` and custom `extension` grant types.
  - Can be used with _node-style_ callbacks, promises and ES6 _async_/_await_.
  - Fully [RFC6749](https://tools.ietf.org/html/rfc6749) and [RFC6750](https://tools.ietf.org/html/rfc6750) compliant.
  - Implicitly supports any form of storage e.g. _PostgreSQL_, _MySQL_, _Mongo_, _Redis_, _etc_.
  - Full test suite.

# Documentation

  - [Server options][wiki-server-options]
  - [Model specification][wiki-model-specification]
    - [Authorization Code][wiki-model-specification]
    - [Client Credentials][wiki-model-specification]
    - [Password][wiki-model-specification]
    - [Refresh token][wiki-model-specification]
    - [Custom extension][wiki-model-specification]

# Examples

  Most users should refer to our [express](https://github.com/seegno/express-oauth-server/tree/master/examples) or [koa](https://github.com/thomseddon/koa-oauth-server/tree/master/examples) examples. If you're implementing a custom server, we have many examples available:

  - A simple **password** grant authorization [example](examples/password).
  - A more complex **password** and **refresh_token** [example](examples/refresh-token).
  - An advanced **password**, **refresh_token** and **authorization_code** (with scopes) [example](examples/authorization-code).

# Upgrading from 2.x

  This module has been rewritten with a promise-based approach and introduced a few changes in the model specification.

  Please refer to our [3.0 migration guide][wiki-migrating-from-2x-to-3x] for more information.

## License

  [MIT](LICENSE)

<!--- badge links -->
[npm-image]: https://img.shields.io/npm/v/oauth2-server.svg
[npm-url]: https://npmjs.org/package/oauth2-server
[travis-image]: https://img.shields.io/travis/oauthjs/node-oauth2-server/master.svg
[travis-url]: https://travis-ci.org/oauthjs/node-oauth2-server
[downloads-image]: https://img.shields.io/npm/dm/oauth2-server.svg
[downloads-url]: https://npmjs.org/package/oauth2-server

<!--- wiki links -->
[wiki-model-specification]: https://github.com/oauthjs/node-oauth2-server/wiki/Model-specification
[wiki-migrating-from-2x-to-3x]: https://github.com/oauthjs/node-oauth2-server/wiki/Migrating-from-2-x-to-3-x
[wiki-server-options]: https://github.com/oauthjs/node-oauth2-server/wiki/Server-options
