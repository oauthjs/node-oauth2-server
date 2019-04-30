import * as should from 'should';
import * as util from 'util';
import {
  AccessDeniedError,
  InvalidArgumentError,
  InvalidClientError,
  InvalidRequestError,
  ServerError,
  UnauthorizedClientError,
  UnsupportedGrantTypeError,
} from '../../../lib/errors';
import { PasswordGrantType } from '../../../lib/grant-types';
import { TokenHandler } from '../../../lib/handlers';
import { Request } from '../../../lib/request';
import { Response } from '../../../lib/response';
import { BearerTokenType } from '../../../lib/token-types';

/**
 * Test `TokenHandler` integration.
 */

describe('TokenHandler integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `options.accessTokenLifetime` is missing', () => {
      try {
        new TokenHandler();

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', () => {
      try {
        new TokenHandler({ accessTokenLifetime: 120 });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if `options.refreshTokenLifetime` is missing', () => {
      try {
        new TokenHandler({ accessTokenLifetime: 120, model: {} });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `refreshTokenLifetime`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', () => {
      try {
        new TokenHandler({
          accessTokenLifetime: 120,
          model: {},
          refreshTokenLifetime: 120,
        });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getClient()`',
        );
      }
    });

    it('should set the `accessTokenLifetime`', () => {
      const accessTokenLifetime = {};
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime,
        model,
        refreshTokenLifetime: 120,
      });

      handler.accessTokenLifetime.should.equal(accessTokenLifetime);
    });

    it('should set the `alwaysIssueNewRefreshToken`', () => {
      const alwaysIssueNewRefreshToken = true;
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 120,
        alwaysIssueNewRefreshToken,
      });

      handler.alwaysIssueNewRefreshToken.should.equal(
        alwaysIssueNewRefreshToken,
      );
    });

    it('should set the `alwaysIssueNewRefreshToken` to false', () => {
      const alwaysIssueNewRefreshToken = false;
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 120,
        alwaysIssueNewRefreshToken,
      });

      handler.alwaysIssueNewRefreshToken.should.equal(
        alwaysIssueNewRefreshToken,
      );
    });

    it('should return the default `alwaysIssueNewRefreshToken` value', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 120,
      });

      handler.alwaysIssueNewRefreshToken.should.equal(true);
    });

    it('should set the `extendedGrantTypes`', () => {
      const extendedGrantTypes = { foo: 'bar' };
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        extendedGrantTypes,
        model,
        refreshTokenLifetime: 120,
      });

      handler.grantTypes.should.containEql(extendedGrantTypes);
    });

    it('should set the `model`', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });

      handler.model.should.equal(model);
    });

    it('should set the `refreshTokenLifetime`', () => {
      const refreshTokenLifetime = {};
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime,
      });

      handler.refreshTokenLifetime.should.equal(refreshTokenLifetime);
    });
  });

  describe('handle()', () => {
    it('should throw an error if `request` is missing', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
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

    it('should throw an error if `response` is missing', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handle(request, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: `response` must be an instance of Response',
        );
      }
    });

    it('should throw an error if the method is not `POST`', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: 'GET',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: method must be POST');
        });
    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal(
            'Invalid request: content must be application/x-www-form-urlencoded',
          );
        });
    });

    it('should throw the error if an oauth error is thrown', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal(
            'Invalid client: cannot retrieve client credentials',
          );
        });
    });

    it('should throw a server error if a non-oauth error is thrown', () => {
      const model = {
        getClient() {
          throw new Error('Unhandled exception');
        },
        getUser() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          grant_type: 'password',
          password: 'bar',
          username: 'foo',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
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
          e.inner.should.be.an.instanceOf(Error);
        });
    });

    it('should update the response if an error is thrown', () => {
      const model = {
        getClient() {
          throw new Error('Unhandled exception');
        },
        getUser() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          grant_type: 'password',
          password: 'bar',
          username: 'foo',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(() => {
          response.body.should.eql({
            error: 'server_error',
            error_description: 'Unhandled exception',
          });
          response.status.should.equal(500);
        });
    });

    it('should return a bearer token if successful', async () => {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: 'foobar',
        user: {},
      };
      const model = {
        getClient() {
          return { grants: ['password'] };
        },
        getUser() {
          return {};
        },
        saveToken() {
          return token;
        },
        validateScope() {
          return 'baz';
        },
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });
      try {
        const data = await handler.handle(request, response);
        data.should.eql(token);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    it('should not return custom attributes in a bearer token if the allowExtendedTokenAttributes is not set', () => {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: 'foobar',
        user: {},
        foo: 'bar',
      };
      const model = {
        getClient() {
          return { grants: ['password'] };
        },
        getUser() {
          return {};
        },
        saveToken() {
          return token;
        },
        validateScope() {
          return 'baz';
        },
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.exist(response.body.access_token);
          should.exist(response.body.refresh_token);
          should.exist(response.body.token_type);
          should.exist(response.body.scope);
          should.not.exist(response.body.foo);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should return custom attributes in a bearer token if the allowExtendedTokenAttributes is set', async () => {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: 'foobar',
        user: {},
        foo: 'bar',
      };
      const model = {
        getClient() {
          return { grants: ['password'] };
        },
        getUser() {
          return {};
        },
        saveToken() {
          return token;
        },
        validateScope() {
          return 'baz';
        },
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
        allowExtendedTokenAttributes: true,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked',
        },
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      await handler.handle(request, response);
      should.exist(response.body.access_token);
      should.exist(response.body.refresh_token);
      should.exist(response.body.token_type);
      should.exist(response.body.scope);
      should.exist(response.body.foo);
    });
  });

  describe('getClient()', () => {
    it('should throw an error if `clientId` is invalid', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'øå€£‰', client_secret: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_id`');
      }
    });

    it('should throw an error if `clientSecret` is invalid', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'foo', client_secret: 'øå€£‰' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_secret`');
      }
    });

    it('should throw an error if `client` is missing', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request, undefined)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should throw an error if `client.grants` is missing', () => {
      const model = {
        getClient() {
          return {};
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request, undefined)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: missing client `grants`');
        });
    });

    it('should throw an error if `client.grants` is invalid', async () => {
      const model = {
        getClient() {
          return { grants: 'foobar' };
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });
      try {
        await handler.getClient(request, undefined);
        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(ServerError);
        e.message.should.equal('Server error: `grants` must be an array');
      }
    });

    it('should throw a 401 error if the client is invalid and the request contains an authorization header', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {
          authorization: util.format(
            'Basic %s',
            Buffer.from('foo:bar').toString('base64'),
          ),
        },
        method: {},
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .getClient(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.code.should.equal(401);
          e.message.should.equal('Invalid client: client is invalid');

          response
            .get('WWW-Authenticate')
            .should.equal('Basic realm="Service"');
        });
    });

    it('should return a client', async () => {
      const client = { id: 12345, grants: [] };
      const model = {
        getClient() {
          return client;
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });
      try {
        const data = await handler.getClient(request, undefined);
        data.should.equal(client);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    describe('with `password` grant type and `requireClientAuthentication` is false', () => {
      it('should return a client ', () => {
        const client = { id: 12345, grants: [] };
        const model = {
          async getClient() {
            return client;
          },
          async saveToken() {},
        };

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false,
          },
        });
        const request = new Request({
          body: { client_id: 'blah', grant_type: 'password' },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .getClient(request, undefined)
          .then(data => {
            data.should.equal(client);
          })
          .catch(() => {
            should.fail('should.fail', '');
          });
      });
    });

    describe('with `password` grant type and `requireClientAuthentication` is false and Authorization header', () => {
      it('should return a client ', () => {
        const client = { id: 12345, grants: [] };
        const model = {
          async getClient() {
            return client;
          },
          async saveToken() {},
        };

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false,
          },
        });
        const request = new Request({
          body: { grant_type: 'password' },
          headers: {
            authorization: util.format(
              'Basic %s',
              Buffer.from('blah:').toString('base64'),
            ),
          },
          method: {},
          query: {},
        });

        return handler
          .getClient(request, undefined)
          .then(data => {
            data.should.equal(client);
          })
          .catch(() => {
            should.fail('should.fail', '');
          });
      });
    });

    it('should support promises', () => {
      const model = {
        getClient() {
          return Promise.resolve({ grants: [] });
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request, undefined).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const model = {
        getClient() {
          return { grants: [] };
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request, undefined).should.be.an.instanceOf(Promise);
    });

    /*     it('should support callbacks', () => {
      const model = {
        getClient(clientId, clientSecret, callback) {
          callback(null, { grants: [] });
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request, undefined).should.be.an.instanceOf(Promise);
    }); */
  });

  describe('getClientCredentials()', () => {
    it('should throw an error if `client_id` is missing', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_secret: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        handler.getClientCredentials(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal(
          'Invalid client: cannot retrieve client credentials',
        );
      }
    });

    it('should throw an error if `client_secret` is missing', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        handler.getClientCredentials(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidClientError);
        e.message.should.equal(
          'Invalid client: cannot retrieve client credentials',
        );
      }
    });

    describe('with `client_id` and grant type is `password` and `requireClientAuthentication` is false', () => {
      it('should return a client', () => {
        const model = {
          getClient() {},
          saveToken() {},
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: { password: false },
        });
        const request = new Request({
          body: { client_id: 'foo', grant_type: 'password' },
          headers: {},
          method: {},
          query: {},
        });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo' });
      });
    });

    describe('with `client_id` and `client_secret` in the request header as basic auth', () => {
      it('should return a client', () => {
        const model = {
          getClient() {},
          saveToken() {},
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {},
          headers: {
            authorization: util.format(
              'Basic %s',
              Buffer.from('foo:bar').toString('base64'),
            ),
          },
          method: {},
          query: {},
        });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });

    describe('with `client_id` and `client_secret` in the request body', () => {
      it('should return a client', () => {
        const model = {
          getClient() {},
          saveToken() {},
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: { client_id: 'foo', client_secret: 'bar' },
          headers: {},
          method: {},
          query: {},
        });
        const credentials = handler.getClientCredentials(request);

        credentials.should.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });
  });

  describe('handleGrantType()', () => {
    it('should throw an error if `grant_type` is missing', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `grant_type`');
      }
    });

    it('should throw an error if `grant_type` is invalid', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: '~foo~' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request, undefined);
        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `grant_type`');
      }
    });

    it('should throw an error if `grant_type` is unsupported', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(UnsupportedGrantTypeError);
        e.message.should.equal(
          'Unsupported grant type: `grant_type` is invalid',
        );
      }
    });

    it('should throw an error if `grant_type` is unauthorized', async () => {
      const client: any = { grants: ['client_credentials'] };
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: 'password' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handleGrantType(request, client);
        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(UnauthorizedClientError);
        e.message.should.equal('Unauthorized client: `grant_type` is invalid');
      }
    });

    /*    it('should throw an invalid grant error if a non-oauth error is thrown', () => {
      const client = { grants: ['password'] };
      const model = {
        getClient(clientId, password, callback) {
          callback(null, client);
        },
        getUser(uid, pwd, callback) {
          callback();
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { grant_type: 'password', username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .handleGrantType(request, client)
        .then(() => should.fail('should.fail', ''))
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    }); */

    describe('with grant_type `authorization_code`', () => {
      it('should return a token', () => {
        const client: any = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode() {
            return {
              authorizationCode: 12345,
              client: { id: 'foobar' },
              expiresAt: new Date(new Date().getTime() * 2),
              user: {},
            };
          },
          getClient() {},
          saveToken() {
            return token;
          },
          validateScope() {
            return 'foo';
          },
          revokeAuthorizationCode() {
            return {
              authorizationCode: 12345,
              client: { id: 'foobar' },
              expiresAt: new Date(new Date().getTime() / 2),
              user: {},
            };
          },
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler.handleGrantType(request, client).then(data => {
          data.should.equal(token);
        });
        // .catch(() => {
        //   should.fail('should.fail', '');
        // });
      });
    });

    describe('with grant_type `client_credentials`', () => {
      it('should return a token', () => {
        const client: any = { grants: ['client_credentials'] };
        const token = {};
        const model = {
          getClient() {},
          getUserFromClient() {
            return {};
          },
          saveToken() {
            return token;
          },
          validateScope() {
            return 'foo';
          },
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            grant_type: 'client_credentials',
            scope: 'foo',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(data => {
            data.should.equal(token);
          })
          .catch(() => {
            should.fail('should.fail', '');
          });
      });
    });

    describe('with grant_type `password`', () => {
      it('should return a token', () => {
        const client: any = { grants: ['password'] };
        const token = {};
        const model = {
          getClient() {},
          getUser() {
            return {};
          },
          saveToken() {
            return token;
          },
          validateScope() {
            return 'baz';
          },
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            client_id: 12345,
            client_secret: 'secret',
            grant_type: 'password',
            password: 'bar',
            username: 'foo',
            scope: 'baz',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(data => {
            data.should.equal(token);
          })
          .catch(() => {
            should.fail('should.fail', '');
          });
      });
    });

    describe('with grant_type `refresh_token`', () => {
      it('should return a token', () => {
        const client: any = { grants: ['refresh_token'] };
        const token = { accessToken: 'foo', client: {}, user: {} };
        const model = {
          getClient() {},
          getRefreshToken() {
            return {
              accessToken: 'foo',
              client: {},
              refreshTokenExpiresAt: new Date(new Date().getTime() * 2),
              user: {},
            };
          },
          saveToken() {
            return token;
          },
          revokeToken() {
            return {
              accessToken: 'foo',
              client: {},
              refreshTokenExpiresAt: new Date(new Date().getTime() / 2),
              user: {},
            };
          },
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
        });
        const request = new Request({
          body: {
            grant_type: 'refresh_token',
            refresh_token: 12345,
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(data => {
            data.should.equal(token);
          })
          .catch(() => {
            should.fail('should.fail', '');
          });
      });
    });

    describe('with custom grant_type', () => {
      it('should return a token', () => {
        const client: any = {
          grants: ['urn:ietf:params:oauth:grant-type:saml2-bearer'],
        };
        const token = {};
        const model = {
          getClient() {},
          getUser() {
            return {};
          },
          saveToken() {
            return token;
          },
          validateScope() {
            return 'foo';
          },
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model,
          refreshTokenLifetime: 120,
          extendedGrantTypes: {
            'urn:ietf:params:oauth:grant-type:saml2-bearer': PasswordGrantType,
          },
        });
        const request = new Request({
          body: {
            grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
            username: 'foo',
            password: 'bar',
          },
          headers: {},
          method: {},
          query: {},
        });

        return handler
          .handleGrantType(request, client)
          .then(data => {
            data.should.equal(token);
          })
          .catch(() => {
            should.fail('should.fail', '');
          });
      });
    });
  });

  describe('getAccessTokenLifetime()', () => {
    it('should return the client access token lifetime', () => {
      const client: any = { accessTokenLifetime: 60 };
      const model = {
        getClient() {
          return client;
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });

      handler.getAccessTokenLifetime(client).should.equal(60);
    });

    it('should return the default access token lifetime', () => {
      const client: any = {};
      const model = {
        getClient() {
          return client;
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });

      handler.getAccessTokenLifetime(client).should.equal(120);
    });
  });

  describe('getRefreshTokenLifetime()', () => {
    it('should return the client access token lifetime', () => {
      const client: any = { refreshTokenLifetime: 60 };
      const model = {
        getClient() {
          return client;
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });

      handler.getRefreshTokenLifetime(client).should.equal(60);
    });

    it('should return the default access token lifetime', () => {
      const client: any = {};
      const model = {
        getClient() {
          return client;
        },
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });

      handler.getRefreshTokenLifetime(client).should.equal(120);
    });
  });

  describe('getTokenType()', () => {
    it('should return a token type', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const tokenType = handler.getTokenType({
        accessToken: 'foo',
        refreshToken: 'bar',
        scope: 'foobar',
      });

      tokenType.should.containEql({
        accessToken: 'foo',
        accessTokenLifetime: undefined,
        refreshToken: 'bar',
        scope: 'foobar',
      });
    });
  });

  describe('updateSuccessResponse()', () => {
    it('should set the `body`', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const tokenType = new BearerTokenType(
        'foo',
        'bar' as any,
        'biz',
        undefined,
        undefined,
      );
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.body.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer',
      });
    });

    it('should set the `Cache-Control` header', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const tokenType = new BearerTokenType(
        'foo',
        'bar' as any,
        'biz',
        undefined,
        undefined,
      );
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.get('Cache-Control').should.equal('no-store');
    });

    it('should set the `Pragma` header', () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const tokenType = new BearerTokenType(
        'foo',
        'bar' as any,
        'biz',
        undefined,
        undefined,
      );
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      response.get('Pragma').should.equal('no-cache');
    });
  });

  describe('updateErrorResponse()', () => {
    it('should set the `body`', () => {
      const error = new AccessDeniedError('Cannot request a token');
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.body.error.should.equal('access_denied');
      response.body.error_description.should.equal('Cannot request a token');
    });

    it('should set the `status`', () => {
      const error = new AccessDeniedError('Cannot request a token');
      const model = {
        getClient() {},
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.status.should.equal(400);
    });
  });
});
