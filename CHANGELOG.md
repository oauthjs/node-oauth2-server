## Changelog

## 4.1.0
### Changed 
* Bump dev dependencies to resolve vulnerabilities
* Replaced jshint with eslint along with should and chai
* Use sha256 when generating tokens

### Added
* Added markdown files to discuss coding rules, commit conventions, contributing guidelines, etc.

### Removed
* Removed lodash dependency
* Removed statuses package and use built in http.STATUS_CODES instead.

### 4.0.0
 * Bump jshint from 2.12.0 to 2.13.0
 * Bump jshint from 2.12.0 to 2.13.0
 * Upgrade to GitHub-native Dependabot
 * [Security] Bump lodash from 4.17.19 to 4.17.21

### 3.1.0
* new: .npmignore tests
* fix: validate requested scope on authorize request
* fix: always issue correct expiry dates for tokens
* fix: set numArgs for promisify of generateAuthorizationCode
* fix: Changed 'hasOwnProperty' call in Response
* docs: Ensure accessTokenExpiresAt is required
* docs: Add missing notice of breaking change for accessExpireLifetime to migration guide
* docs: Correct tokens time scale for 2.x to 3.x  migration guide
* readme: Update Slack badge and link
* readme: Fix link to RFC6750 standard

### 3.0.2 (24/05/2020)

* Update all dependencies 🎉

### 3.0.1 (27/08/2018)

* Doc fixes

Tag never released on npm

### 3.0.0 (04/08/2017)
* Complete re-write, with Promises and callback support
* Dropped support for node v0.8, v0.10, v0.12
* Supports Node v4, v6, v7, and v8.  Will continue support for node current and active LTS versions
* For migration guide, see https://oauth2-server.readthedocs.io/en/latest/misc/migrating-v2-to-v3.html

### 2.4.1

- Fix header setting syntax
- Fix docs for supported grant types

### 2.4.0

- Set Cache-Control and Pragma headers
- Allow any valid URI for extension grants
- Expose `client` to `extendedGrant` and after via `req.oauth.client`
- Fix express depreciation warning for `res.send()`
- Expose `user` to `generateToken` and after via `req.user`
- Fix lockdown pattern for express 3

- Add redis example
- Fix docs to use new express bodyParser module
- Fix docs for `redirect_uri`
- Clarify docs for `clientIdRegex`
- Fix docs for missing `req` argument in `generateToken`
- Fix docs for `user`/`userId` `getAccessToken`
- Fix docs for argument order in `getRefreshToken`

### 2.3.0

 - Support "state" param for auth_code grant type
 - Docs for client_credentials grant type
 - Fix `getRefreshToken` in postgres model example

### 2.2.2

 - Fix bug when client has multiple redirect_uri's (#84)

### 2.2.1

 - Fix node 0.8.x (well npm 1.2.x) support

### 2.2.0

 - Support custom loggers via `debug` param
 - Make OAuth2Error inherit from Error for fun and profit
 - Don't go crazy when body is `null`
 - Update tests and examples to express 4
 - Fix lockdown pattern for express 4
 - Update dev dependencies (mocha, should and supertest)

### 2.1.1

 - Allow client to return an array of multiple valid redirect URI's
 - Fix continueAfterResponse when granting

### 2.1.0
 - Add support for client_credentials grant type (@lucknerjb)
 - Support Authorization grant via GET request (@mjsalinger)

### 2.0.2
 - Fix continueAfterResponse option

### 2.0.1
 - Add "WWW-Authenticate" header for invalid_client

### 2.0
 - Huge intrenal refactor
 - Switch from internal router ("allow" property) to exposing explit authorisation middleware to be added to individual routes
 - Expose grant middleware to be attached to a route of your choosing
 - Switch all model variables to camelCasing
 - Add support for `authorization_code` grant type (i.e. traditional "allow", "deny" with redirects etc.)
 - Some, previously wrong, error codes fixed

### 1.5.3
 - Fix tests for daylight saving

### 1.5.2
 - Fix expiration token checking (previously expires was wrongly checked against boot time)

### 1.5.1
 - Add repository field to package

### 1.5.0
 - Add support for non-expiring tokens (set accessTokenLifetime/refreshTokenLifetime = null)
 - Passthrough debug errors from custom generateToken

### 1.4.1
 - Allow access token in body when not POST (only deny GET)

### 1.4.0
 - Add support for refresh_token grant type

### 1.3.2
- Require application/x-www-form-urlencoded when access token in body
- Require authentication on both client id and secret

### 1.3.1
 - Fix client credentials extraction from Authorization header

### 1.3.0
 - Add passthroughErrors option
 - Optimise oauth.handler() with regex caching
 - Add PostgreSQL example
 - Allow req.user to be set by setting token.user in getAccessToken

### 1.2.5
 - Expose the token passed back from getAccessToken in req.token

### 1.2.4
 - Pass through Bad Request errors from connect

### 1.2.3
 - Fix generateToken override
 - Allow extended grant to pass back custom error

### 1.2.2
 - Fix reissuing

### 1.2.1
 - Allow token reissuing (Model can return an object to indicate a reissue, plain string (as in previous implementation) or null to revert to the default token generator)

### 1.2.0
 - Add optional generateToken method to model to allow custom token generation

### 1.1.1
 - Fix expired token checking

### 1.1.0
 - Add support for extension grants
 - Use async crypto.randomBytes in token generation
 - Refactor structure, break into more files
