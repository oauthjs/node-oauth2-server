import * as should from 'should';
import {
  AccessDeniedError,
  InsufficientScopeError,
  InvalidArgumentError,
  InvalidRequestError,
  InvalidTokenError,
  ServerError,
  UnauthorizedRequestError,
} from '../../../lib/errors';
import { AuthenticateHandler } from '../../../lib/handlers';
import { Request } from '../../../lib/request';
import { Response } from '../../../lib/response';

/**
 * Test `AuthenticateHandler` integration.
 */

describe('AuthenticateHandler integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `options.model` is missing', () => {
      try {
        new AuthenticateHandler();

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getAccessToken()`', () => {
      try {
        new AuthenticateHandler({ model: {} });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getAccessToken()`',
        );
      }
    });

    it('should throw an error if `scope` was given and `addAcceptedScopesHeader()` is missing', () => {
      try {
        new AuthenticateHandler({
          model: { getAccessToken() {} },
          scope: 'foobar',
        });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `addAcceptedScopesHeader`');
      }
    });

    it('should throw an error if `scope` was given and `addAuthorizedScopesHeader()` is missing', () => {
      try {
        new AuthenticateHandler({
          addAcceptedScopesHeader: true,
          model: { getAccessToken() {} },
          scope: 'foobar',
        });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Missing parameter: `addAuthorizedScopesHeader`',
        );
      }
    });

    it('should throw an error if `scope` was given and the model does not implement `verifyScope()`', () => {
      try {
        new AuthenticateHandler({
          addAcceptedScopesHeader: true,
          addAuthorizedScopesHeader: true,
          model: { getAccessToken() {} },
          scope: 'foobar',
        });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `verifyScope()`',
        );
      }
    });

    it('should set the `model`', () => {
      const model = { getAccessToken() {} };
      const grantType = new AuthenticateHandler({ model });

      grantType.model.should.equal(model);
    });

    it('should set the `scope`', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {},
      };
      const grantType = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model,
        scope: 'foobar',
      });

      grantType.scope.should.equal('foobar');
    });
  });

  describe('handle()', () => {
    it('should throw an error if `request` is missing', async () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });

      try {
        await handler.handle(undefined, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: `request` must be an instance of Request',
        );
      }
    });

    it('should set the `WWW-Authenticate` header if an unauthorized request error is thrown', () => {
      const model = {
        getAccessToken() {
          throw new UnauthorizedRequestError(undefined, undefined);
        },
      };
      const handler = new AuthenticateHandler({ model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(() => {
          response
            .get('WWW-Authenticate')
            .should.equal('Bearer realm="Service"');
        });
    });

    it('should throw the error if an oauth error is thrown', () => {
      const model = {
        getAccessToken() {
          throw new AccessDeniedError('Cannot request this access token');
        },
      };
      const handler = new AuthenticateHandler({ model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(AccessDeniedError);
          e.message.should.equal('Cannot request this access token');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', () => {
      const model = {
        getAccessToken() {
          throw new Error('Unhandled exception');
        },
      };
      const handler = new AuthenticateHandler({ model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Unhandled exception');
        });
    });

    it('should return an access token', () => {
      const accessToken: any = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
      };
      const model = {
        getAccessToken() {
          return accessToken;
        },
        verifyScope() {
          return true;
        },
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model,
        scope: 'foo',
      });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(data => {
          data.should.equal(accessToken);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });
  });

  describe('getTokenFromRequest()', () => {
    it('should throw an error if more than one authentication method is used', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: { access_token: 'foo' },
      });

      try {
        handler.getTokenFromRequest(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal(
          'Invalid request: only one authentication method is allowed',
        );
      }
    });

    it('should throw an error if `accessToken` is missing', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        handler.getTokenFromRequest(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(UnauthorizedRequestError);
        e.message.should.equal('Unauthorized request: no authentication given');
      }
    });
  });

  describe('getTokenFromRequestHeader()', () => {
    it('should throw an error if the token is malformed', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });
      const request = new Request({
        body: {},
        headers: {
          Authorization: 'foobar',
        },
        method: {},
        query: {},
      });

      try {
        handler.getTokenFromRequestHeader(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal(
          'Invalid request: malformed authorization header',
        );
      }
    });

    it('should return the bearer token', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });
      const request = new Request({
        body: {},
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {},
      });

      const bearerToken = handler.getTokenFromRequestHeader(request);

      bearerToken.should.equal('foo');
    });
  });

  describe('getTokenFromRequestQuery()', () => {
    it('should throw an error if the query contains a token', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });

      try {
        handler.getTokenFromRequestQuery(undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal(
          'Invalid request: do not send bearer tokens in query URLs',
        );
      }
    });

    it('should return the bearer token if `allowBearerTokensInQueryString` is true', () => {
      const handler = new AuthenticateHandler({
        allowBearerTokensInQueryString: true,
        model: { getAccessToken() {} },
      });
      const req = { query: { access_token: 'foo' } };
      handler.getTokenFromRequestQuery(req as Request).should.equal('foo');
    });
  });

  describe('getTokenFromRequestBody()', () => {
    it('should throw an error if the method is `GET`', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: 'GET',
        query: {},
      });

      try {
        handler.getTokenFromRequestBody(request);
        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal(
          'Invalid request: token may not be passed in the body when using the GET verb',
        );
      }
    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        handler.getTokenFromRequestBody(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal(
          'Invalid request: content must be application/x-www-form-urlencoded',
        );
      }
    });

    it('should return the bearer token', () => {
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: {},
        query: {},
      });

      handler.getTokenFromRequestBody(request).should.equal('foo');
    });
  });

  describe('getAccessToken()', () => {
    it('should throw an error if `accessToken` is missing', () => {
      const model = {
        getAccessToken() {},
      };
      const handler = new AuthenticateHandler({ model });

      return handler
        .getAccessToken('foo')
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: access token is invalid');
        });
    });

    it('should throw an error if `accessToken.user` is missing', () => {
      const model = {
        getAccessToken() {
          return {};
        },
      };
      const handler = new AuthenticateHandler({ model });

      return handler
        .getAccessToken('foo')
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `getAccessToken()` did not return a `user` object',
          );
        });
    });

    it('should return an access token', () => {
      const accessToken: any = { user: {} };
      const model = {
        getAccessToken() {
          return accessToken;
        },
      };
      const handler = new AuthenticateHandler({ model });

      return handler
        .getAccessToken('foo')
        .then(data => {
          data.should.equal(accessToken);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should support promises', () => {
      const model = {
        getAccessToken() {
          return Promise.resolve({ user: {} });
        },
      };
      const handler = new AuthenticateHandler({ model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const model = {
        getAccessToken() {
          return { user: {} };
        },
      };
      const handler = new AuthenticateHandler({ model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    });

    /*   it('should support callbacks', () => {
      const model = {
        getAccessToken(token, callback) {
          callback(null, { user: {} });
        },
      };
      const handler = new AuthenticateHandler({ model });

      handler.getAccessToken('foo').should.be.an.instanceOf(Promise);
    }); */
  });

  describe('validateAccessToken()', () => {
    it('should throw an error if `accessToken` is expired', () => {
      const accessToken: any = {
        accessTokenExpiresAt: new Date(new Date().getTime() / 2),
      };
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });

      try {
        handler.validateAccessToken(accessToken);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidTokenError);
        e.message.should.equal('Invalid token: access token has expired');
      }
    });

    it('should return an access token', () => {
      const accessToken: any = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
      };
      const handler = new AuthenticateHandler({
        model: { getAccessToken() {} },
      });

      handler.validateAccessToken(accessToken).should.equal(accessToken);
    });
  });

  describe('verifyScope()', () => {
    it('should throw an error if `scope` is insufficient', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {
          return false;
        },
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model,
        scope: 'foo',
      });

      return handler
        .verifyScope('foo' as any)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InsufficientScopeError);
          e.message.should.equal(
            'Insufficient scope: authorized scope is insufficient',
          );
        });
    });

    it('should support promises', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {
          return true;
        },
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model,
        scope: 'foo',
      });

      handler.verifyScope('foo' as any).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {
          return true;
        },
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model,
        scope: 'foo',
      });

      handler.verifyScope('foo' as any).should.be.an.instanceOf(Promise);
    });

    /*    it('should support callbacks', () => {
      const model = {
        getAccessToken() {},
        verifyScope(token, scope, callback) {
          callback(null, true);
        },
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model,
        scope: 'foo',
      });

      handler.verifyScope('foo').should.be.an.instanceOf(Promise);
    }); */
  });

  describe('updateResponse()', () => {
    it('should not set the `X-Accepted-OAuth-Scopes` header if `scope` is not specified', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {},
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: false,
        model,
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' } as any);

      response.headers.should.not.have.property('x-accepted-oauth-scopes');
    });

    it('should set the `X-Accepted-OAuth-Scopes` header if `scope` is specified', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {},
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: false,
        model,
        scope: 'foo bar',
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' } as any);

      response.get('X-Accepted-OAuth-Scopes').should.equal('foo bar');
    });

    it('should not set the `X-Authorized-OAuth-Scopes` header if `scope` is not specified', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {},
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: false,
        addAuthorizedScopesHeader: true,
        model,
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' } as any);

      response.headers.should.not.have.property('x-oauth-scopes');
    });

    it('should set the `X-Authorized-OAuth-Scopes` header', () => {
      const model = {
        getAccessToken() {},
        verifyScope() {},
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: false,
        addAuthorizedScopesHeader: true,
        model,
        scope: 'foo bar',
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: 'foo biz' } as any);

      response.get('X-OAuth-Scopes').should.equal('foo biz');
    });
  });
});
