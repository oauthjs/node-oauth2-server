===========================
 Migrating from 2.x to 3.x
===========================

This module is now promise-based but allows for *ES6 generators*, *async/await* (using _[babel](https://babeljs.io)_ or node v7.6+), *node-style* callbacks and *promises* in your model.

## Middlewares

  The naming of the exposed middlewares has changed to match the OAuth2 _RFC_ more closely. Please refer to the table below:

| oauth2-server 2.x | oauth2-server 3.x                              |
|-------------------|------------------------------------------------|
| authorise         | authenticate                                   |
| authCodeGrant     | authorize                                      |
| grant             | token                                          |
| errorHandler      | **removed** (now handled by external wrappers) |
| lockdown          | **removed** (specific to _Express_ middleware) |

## Server options

The following server options can be set when instantiating the OAuth service:  

  * `addAcceptedScopesHeader`: **default true** Add the `X-Accepted-OAuth-Scopes` header with a list of scopes that will be accepted
  * `addAuthorizedScopesHeader`: **default true** Add the `X-OAuth-Scopes` header with a list of scopes that the user is authorized for
  * `allowBearerTokensInQueryString`: **default false** Determine if the bearer token can be included in the query string (i.e. `?access_token=`) for validation calls
  * `allowEmptyState`: **default false** If true, `state` can be empty or not passed.  If false, `state` is required.
  * `authorizationCodeLifetime`: **default 300** Default number of milliseconds that the authorization code is active for
  * `accessTokenLifetime`: **default 3600** Default number of milliseconds that an access token is valid for
  * `refreshTokenLifetime`: **default 1209600** Default number of milliseconds that a refresh token is valid for
  * `allowExtendedTokenAttributes`: **default false** Allows additional attributes (such as `id_token`) to be included in token responses.
  * `requireClientAuthentication`: **default true for all grant types** Allow ability to set client/secret authentication to `false` for a specific grant type.   

The following server options have been removed in v3.0.0

  * `grants`: **removed** (now returned by the _getClient_ method).
  * `debug`: **removed** (not the responsibility of this module).
  * `clientIdRegex`: **removed** (the _getClient_ method can return _undefined_ or throw an error).
  * `passthroughErrors`: **removed** (not the responsibility of this module).
  * `continueAfterResponse`: **removed** (not the responsibility of this module).

## Model specification

  * `generateAccessToken(client, user, scope)` is **optional** and should return a _String.

  * `generateAuthorizationCode()` is **optional** and should return a _String.

  * `generateRefreshToken(client, user, scope)` is **optional** and should return a _String.

  * `getAccessToken(token)` should return an object with:
    * `accessToken` (_String_)
    * `accessTokenExpiresAt` (_Date_)
    * `client` (_Object_),  containing at least an `id` property that matches the supplied client
    * `scope` (optional _String_)
    * `user` (_Object_)

  * `getAuthCode()` was renamed to `getAuthorizationCode(code)` and should return:
    * `client` (_Object_), containing at least an `id` property that matches the supplied client
    * `expiresAt` (_Date_)
    * `redirectUri` (optional _String_)
    * `user` (_Object_)

  * `getClient(clientId, clientSecret)` should return an object with, at minimum:
    * `redirectUris` (_Array_)
    * `grants` (_Array_)

  * `getRefreshToken(token)` should return an object with:
    * `refreshToken` (_String_)
    * `client` (_Object_),  containing at least an `id` property that matches the supplied client
    * `refreshTokenExpiresAt` (optional _Date_)
    * `scope` (optional _String_)
    * `user` (_Object_)

  * `getUser(username, password)` should return an object:
    * No longer requires that `id` be returned.

  * `getUserFromClient(client)` should return an object:
    * No longer requires that `id` be returned.

  * `grantTypeAllowed()` was **removed**. You can instead:
    * Return _falsy_ in your `getClient()`
    * Throw an error in your `getClient()`

  * `revokeAuthorizationCode(code)` is **required** and should return true

  * `revokeToken(token)` is **required** and should return true

  * `saveAccessToken()` was renamed to `saveToken(token, client, user)` and should return:
    * `accessToken` (_String_)
    * `accessTokenExpiresAt` (_Date_)
    * `client` (_Object_)
    * `refreshToken` (optional _String_)
    * `refreshTokenExpiresAt` (optional _Date_)
    * `user` (_Object_)

  * `saveAuthCode()` was renamed to `saveAuthorizationCode(code, client, user)` and should return:
    * `authorizationCode` (_String_)

  * `validateScope(user, client, scope)` should return a _Boolean_.

The full model specification is [also available](https://oauth2-server.readthedocs.io/en/latest/model/spec.html).
