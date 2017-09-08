
# oauth2-server

[![npm Version][npm-image]][npm-url]
[![npm Downloads][downloads-image]][downloads-url]
[![Test Status][travis-image]][travis-url]
[![MIT Licensed][license-image]][license-url]
[![oauthjs Slack][slack-image]][slack-url]

Complete, compliant and well tested module for implementing an OAuth2 server in [Node.js](https://nodejs.org).

Note: After a period of hiatus, this project is now back under active maintenance. Dependencies have been updated and bug fixes will land in v3 (current master). v4 will be _mostly backwards compatible_ with no code changes required for users using a supported node release. More details in [#621](https://github.com/oauthjs/node-oauth2-server/issues/621).

## Installation

```bash
npm install oauth2-server
```

The *oauth2-server* module is framework-agnostic but there are several officially supported wrappers available for popular HTTP server frameworks such as [Express](https://npmjs.org/package/express-oauth-server) and [Koa](https://npmjs.org/package/koa-oauth-server). If you're using one of those frameworks it is strongly recommended to use the respective wrapper module instead of rolling your own.


## Features

- Supports `authorization_code`, `client_credentials`, `refresh_token` and `password` grant, as well as *extension grants*, with scopes.
- Can be used with *promises*, *Node-style callbacks*, *ES6 generators* and *async*/*await* (using [Babel](https://babeljs.io)).
- Fully [RFC 6749](https://tools.ietf.org/html/rfc6749.html) and [RFC 6750](https://tools.ietf.org/html/rfc6750.html) compliant.
- Implicitly supports any form of storage, e.g. *PostgreSQL*, *MySQL*, *MongoDB*, *Redis*, etc.
- Complete [test suite](https://github.com/oauthjs/node-oauth2-server/tree/master/test).


## Documentation

[Documentation](https://oauth2-server.readthedocs.io) is hosted on Read the Docs.


## Examples

Most users should refer to our [Express](https://github.com/oauthjs/express-oauth-server/tree/master/examples) or [Koa](https://github.com/oauthjs/koa-oauth-server/tree/master/examples) examples.

More examples can be found here: https://github.com/14gasher/oauth-example

## Upgrading from 2.x

This module has been rewritten using a promise-based approach, introducing changes to the API and model specification. v2.x is no longer supported.

Please refer to our [3.0 migration guide](https://oauth2-server.readthedocs.io/en/latest/misc/migrating-v2-to-v3.html) for more information.


## Tests

To run the test suite, install dependencies, then run `npm test`:

```bash
npm install
npm test
```


[npm-image]: https://img.shields.io/npm/v/oauth2-server.svg
[npm-url]: https://npmjs.org/package/oauth2-server
[downloads-image]: https://img.shields.io/npm/dm/oauth2-server.svg
[downloads-url]: https://npmjs.org/package/oauth2-server
[travis-image]: https://img.shields.io/travis/oauthjs/node-oauth2-server/master.svg
[travis-url]: https://travis-ci.org/oauthjs/node-oauth2-server
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://raw.githubusercontent.com/oauthjs/node-oauth2-server/master/LICENSE
[slack-image]: https://slack.oauthjs.org/badge.svg
[slack-url]: https://slack.oauthjs.org

