/**
 * Request an access token using the refresh token grant type.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-6
 *
 *   grant_type
 *         REQUIRED.  Value MUST be set to "refresh_token".
 *   refresh_token
 *         REQUIRED.  The refresh token issued to the client.
 *   scope
 *         OPTIONAL.  The scope of the access request as described by
 *         Section 3.3.  The requested scope MUST NOT include any scope
 *         not originally granted by the resource owner, and if omitted is
 *         treated as equal to the scope originally granted by the
 *         resource owner.
 */


/**
 * Response
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.1
 *
 *   access_token
 *         REQUIRED.  The access token issued by the authorization server.
 *   token_type
 *         REQUIRED.  The type of the token issued as described in
 *         Section 7.1.  Value is case insensitive.
 *   expires_in
 *         RECOMMENDED.  The lifetime in seconds of the access token.  For
 *         example, the value "3600" denotes that the access token will
 *         expire in one hour from the time the response was generated.
 *         If omitted, the authorization server SHOULD provide the
 *         expiration time via other means or document the default value.
 *   refresh_token
 *         OPTIONAL.  The refresh token, which can be used to obtain new
 *         access tokens using the same authorization grant as described
 *         in Section 6.
 *   scope
 *         OPTIONAL, if identical to the scope requested by the client;
 *         otherwise, REQUIRED.  The scope of the access token as
 *         described by Section 3.3.
 */

/**
 * Response (error)
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 *
 *   error
 *         REQUIRED.  A single ASCII [USASCII] error code from the following:
 *         invalid_request, invalid_client, invalid_grant
 *         unauthorized_client, unsupported_grant_type, invalid_scope
 *   error_description
 *         OPTIONAL.  Human-readable ASCII [USASCII] text providing
 *         additional information, used to assist the client developer in
 *         understanding the error that occurred.
 *   error_uri
 *         OPTIONAL.  A URI identifying a human-readable web page with
 *         information about the error, used to provide the client
 *         developer with additional information about the error.
 */
const OAuth2Server = require('../..');
const DB = require('../helpers/db');
const createModel = require('../helpers/model');
const createRequest = require('../helpers/request');
const Response = require('../../lib/response');

require('chai').should();

const db = new DB();

const auth = new OAuth2Server({
  model: createModel(db)
});

const user = db.saveUser({ id: 1, username: 'test', password: 'test'});
const client = db.saveClient({ id: 'a', secret: 'b', grants: ['password', 'refresh_token'] });
const scope = 'read write';

function createLoginRequest () {
  return createRequest({
    body: {
      grant_type: 'password',
      username: user.username,
      password: user.password,
      scope
    },
    headers: {
      'authorization': 'Basic ' + Buffer.from(client.id + ':' + client.secret).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
  });
}

function createRefreshRequest (refresh_token) {
  return createRequest({
    method: 'POST',
    body: {
      grant_type: 'refresh_token',
      refresh_token,
      scope
    },
    headers: {
      'authorization': 'Basic ' + Buffer.from(client.id + ':' + client.secret).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded'
    }
  });
}

describe('RefreshTokenGrantType Compliance', function () {
  describe('With scope', function () {
    it('Should generate token response', async function () {
      const request = createLoginRequest();
      const response = new Response({});

      const credentials = await auth.token(request, response, {});

      const refreshRequest = createRefreshRequest(credentials.refreshToken);
      const refreshResponse = new Response({});

      const token = await auth.token(refreshRequest, refreshResponse, {});

      refreshResponse.body.token_type.should.equal('Bearer');
      refreshResponse.body.access_token.should.equal(token.accessToken);
      refreshResponse.body.refresh_token.should.equal(token.refreshToken);
      refreshResponse.body.expires_in.should.be.a('number');
      refreshResponse.body.scope.should.equal(scope);

      token.accessToken.should.be.a('string');
      token.refreshToken.should.be.a('string');
      token.accessTokenExpiresAt.should.be.a('date');
      token.refreshTokenExpiresAt.should.be.a('date');
      token.scope.should.equal(scope);

      db.accessTokens.has(token.accessToken).should.equal(true);
      db.refreshTokens.has(token.refreshToken).should.equal(true);
    });

    it('Should throw invalid_grant error', async function () {
      const request = createRefreshRequest('invalid');
      const response = new Response({});

      await auth.token(request, response, {})
        .then(() => {
          throw Error('Should not reach this');
        }).catch(err => {
          err.name.should.equal('invalid_grant');
        });
    });

    // TODO: test refresh token with different scopes
    // https://github.com/node-oauth/node-oauth2-server/issues/104

    // it('Should throw invalid_scope error', async function () {
    //   const request = createLoginRequest();
    //   const response = new Response({});

    //   const credentials = await auth.token(request, response, {});

    //   const refreshRequest = createRefreshRequest(credentials.refreshToken);
    //   const refreshResponse = new Response({});

    //   refreshRequest.scope = 'invalid';

    //   await auth.token(refreshRequest, refreshResponse, {})
    //     .then(() => {
    //       throw Error('Should not reach this');
    //     })
    //     .catch(err => {
    //       err.name.should.equal('invalid_scope');
    //     });
    // });
  });
});
