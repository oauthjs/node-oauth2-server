## Changelog

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
