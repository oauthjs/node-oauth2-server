import * as should from 'should';
import * as util from 'util';
import {
  AccessDeniedError,
  InvalidArgumentError,
  InvalidClientError,
  InvalidRequestError,
  InvalidTokenError,
  ServerError,
} from '../../../lib/errors';
import { RevokeHandler } from '../../../lib/handlers';
import { Request } from '../../../lib/request';
import { Response } from '../../../lib/response';

/**
 * Test `RevokeHandler` integration.
 */

describe('RevokeHandler integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `options.model` is missing', () => {
      try {
        new RevokeHandler({});

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', () => {
      try {
        new RevokeHandler({ model: {} });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getClient()`',
        );
      }
    });

    it('should set the `model`', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      handler.model.should.equal(model);
    });
  });

  describe('handle()', () => {
    it('should throw an error if `request` is missing', async () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      try {
        await handler.handle();

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
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.handle(request);

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
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: {},
        headers: {},
        method: 'GET',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Invalid request: method must be POST');
        });
    });

    it('should throw an error if the media type is not `application/x-www-form-urlencoded`', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: {},
        headers: {},
        method: 'POST',
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(should.fail)
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
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { token: 'hash' },
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
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal(
            'Invalid client: cannot retrieve client credentials',
          );
        });
    });

    it('should throw the error if an oauth error is thrown', () => {
      const model = {
        getClient() {
          return { grants: ['password'] };
        },
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
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
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `token`');
        });
    });

    it('should throw a server error if a non-oauth error is thrown', () => {
      const model = {
        getClient() {
          throw new Error('Unhandled exception');
        },
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          token: 'hash',
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
        .then(should.fail)
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
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
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
        .then(should.fail)
        .catch(() => {
          response.body.should.eql({
            error: 'server_error',
            error_description: 'Unhandled exception',
          });
          response.status.should.equal(500);
        });
    });

    it('should not update the response if an invalid token error is thrown', () => {
      const token = {
        refreshToken: 'hash',
        client: {},
        user: {},
        refreshTokenExpiresAt: new Date('2015-01-01'),
      };
      const client = { grants: ['password'] };
      const model = {
        getClient() {
          return client;
        },
        revokeToken() {
          return token;
        },
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          token: 'hash',
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
        .then(should.fail)
        .catch(e => {
          e[0].should.be.an.instanceOf(InvalidTokenError);
          e[1].should.be.an.instanceOf(InvalidTokenError);
          response.body.should.eql({});
          response.status.should.equal(200);
        });
    });

    it('should return an empty object if successful', () => {
      const token = {
        refreshToken: 'hash',
        client: {},
        user: {},
        refreshTokenExpiresAt: new Date(Date.now() * 2),
      };
      const client = { grants: ['password'] };
      const model = {
        getClient() {
          return client;
        },
        revokeToken() {
          return token;
        },
        getRefreshToken() {
          return token;
        },
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          token: 'hash',
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
        .then(data => {
          should.exist(data);
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', () => {
    it('should throw an error if `clientId` is invalid', async () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 'øå€£‰', client_secret: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_id`');
      }
    });

    it('should throw an error if `clientId` is invalid', async () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 'foo', client_secret: 'øå€£‰' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `client_secret`');
      }
    });

    it('should throw an error if `client` is missing', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(should.fail)
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
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: missing client `grants`');
        });
    });

    it('should throw a 401 error if the client is invalid and the request contains an authorization header', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
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
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.code.should.equal(401);
          e.message.should.equal('Invalid client: client is invalid');

          response
            .get('WWW-Authenticate')
            .should.equal('Basic realm="Service"');
        });
    });

    it('should return a client', () => {
      const client = { id: 12345, grants: [] };
      const model = {
        getClient() {
          return client;
        },
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(data => {
          data.should.equal(client);
        })
        .catch(should.fail);
    });

    it('should support promises', () => {
      const model = {
        getClient() {
          return Promise.resolve({ grants: [] });
        },
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });

    // it('should support callbacks', () => {
    //   const model = {
    //     getClient(clientId, clientSecret, callback) {
    //       callback(null, { grants: [] });
    //     },
    //     revokeToken() {},
    //     getRefreshToken() {},
    //     getAccessToken() {},
    //   };
    //   const handler:any = new RevokeHandler({ model });
    //   const request = new Request({
    //     body: { client_id: 12345, client_secret: 'secret' },
    //     headers: {},
    //     method: {},
    //     query: {},
    //   });

    //   handler.getClient(request).should.be.an.instanceOf(Promise);
    // });

    it('should support non-promises', () => {
      const model = {
        getClient() {
          return { grants: [] };
        },
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    });
  });

  describe('getClientCredentials()', () => {
    it('should throw an error if `client_id` is missing', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
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
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
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

    describe('with `client_id` and `client_secret` in the request header as basic auth', () => {
      it('should return a client', () => {
        const model = {
          getClient() {},
          revokeToken() {},
          getRefreshToken() {},
          getAccessToken() {},
        };
        const handler: any = new RevokeHandler({ model });
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
          revokeToken() {},
          getRefreshToken() {},
          getAccessToken() {},
        };
        const handler: any = new RevokeHandler({ model });
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

  describe('handleRevokeToken()', () => {
    it('should throw an error if `token` is missing', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .handleRevokeToken(request)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidRequestError);
          e.message.should.equal('Missing parameter: `token`');
        });
    });

    it('should return a token', () => {
      const client = { id: 12345, grants: ['password'] };
      const token = {
        accessToken: 'hash',
        client: { id: 12345 },
        accessTokenExpiresAt: new Date(Date.now() * 2),
        user: {},
      };
      const model = {
        getClient() {},
        revokeToken() {
          return token;
        },
        getRefreshToken() {},
        getAccessToken() {
          return token;
        },
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { token: 'hash' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .handleRevokeToken(request, client)
        .then(data => {
          should.exist(data);
        })
        .catch(should.fail);
    });

    it('should return a token', () => {
      const client = { id: 12345, grants: ['password'] };
      const token = {
        refreshToken: 'hash',
        client: { id: 12345 },
        refreshTokenExpiresAt: new Date(Date.now() * 2),
        user: {},
      };
      const model = {
        getClient() {},
        revokeToken() {
          return token;
        },
        getRefreshToken() {
          return token;
        },
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { token: 'hash' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .handleRevokeToken(request, client)
        .then(data => {
          should.exist(data);
        })
        .catch(should.fail);
    });
  });

  describe('getRefreshToken()', () => {
    it('should throw an error if the `refreshToken` is invalid', () => {
      const client = {};
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      return handler
        .getRefreshToken('hash', client)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: refresh token is invalid');
        });
    });

    it('should throw an error if the `client_id` does not match', () => {
      const client = { id: 'foo' };
      const token = {
        refreshToken: 'hash',
        client: { id: 'baz' },
        user: {},
        refreshTokenExpiresAt: new Date(Date.now() * 2),
      };
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {
          return token;
        },
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      return handler
        .getRefreshToken('hash', client)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should return a token', () => {
      const client = { id: 'foo' };
      const token = {
        refreshToken: 'hash',
        client: { id: 'foo' },
        user: {},
        refreshTokenExpiresAt: new Date(Date.now() * 2),
      };
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {
          return token;
        },
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      return handler
        .getRefreshToken('hash', client)
        .then(Token => {
          should.exist(Token);
        })
        .catch(should.fail);
    });

    // it('should support callbacks', () => {
    //   const client = { id: 'foo' };
    //   const token = {
    //     refreshToken: 'hash',
    //     client: { id: 'foo' },
    //     user: {},
    //     refreshTokenExpiresAt: new Date(Date.now() * 2),
    //   };
    //   const model = {
    //     getClient() {},
    //     revokeToken() {},
    //     getRefreshToken(refreshToken, callback) {
    //       callback(null, token);
    //     },
    //     getAccessToken() {},
    //   };
    //   const handler:any = new RevokeHandler({ model });

    //   return handler
    //     .getRefreshToken('hash', client)
    //     .then(token => {
    //       should.exist(token);
    //     })
    //     .catch(should.fail);
    // });
  });

  describe('getAccessToken()', () => {
    it('should throw an error if the `accessToken` is invalid', () => {
      const client = {};
      const model = {
        getClient() {},
        revokeToken() {},
        getAccessToken() {},
        getRefreshToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      return handler
        .getAccessToken('hash', client)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: access token is invalid');
        });
    });

    it('should throw an error if the `client_id` does not match', () => {
      const client = { id: 'foo' };
      const token = {
        accessToken: 'hash',
        client: { id: 'baz' },
        user: {},
        accessTokenExpiresAt: new Date(Date.now() * 2),
      };
      const model = {
        getClient() {},
        revokeToken() {},
        getAccessToken() {
          return token;
        },
        getRefreshToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      return handler
        .getAccessToken('hash', client)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: client is invalid');
        });
    });

    it('should return a token', () => {
      const client = { id: 'foo' };
      const token = {
        accessToken: 'hash',
        client: { id: 'foo' },
        user: {},
        accessTokenExpiresAt: new Date(Date.now() * 2),
      };
      const model = {
        getClient() {},
        revokeToken() {},
        getAccessToken() {
          return token;
        },
        getRefreshToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      return handler
        .getAccessToken('hash', client)
        .then(Token => {
          should.exist(Token);
        })
        .catch(should.fail);
    });

    // it('should support callbacks', () => {
    //   const client = { id: 'foo' };
    //   const token = {
    //     accessToken: 'hash',
    //     client: { id: 'foo' },
    //     user: {},
    //     accessTokenExpiresAt: new Date(Date.now() * 2),
    //   };
    //   const model = {
    //     getClient() {},
    //     revokeToken() {},
    //     getAccessToken(accessToken, callback) {
    //       callback(null, token);
    //     },
    //     getRefreshToken() {},
    //   };
    //   const handler:any = new RevokeHandler({ model });

    //   return handler
    //     .getAccessToken('hash', client)
    //     .then(token => {
    //       should.exist(token);
    //     })
    //     .catch(should.fail);
    // });
  });

  describe('revokeToken()', () => {
    it('should throw an error if the `refreshToken` is invalid', () => {
      const token = 'hash';
      const client = {};
      const model = {
        getClient() {},
        revokeToken() {
          return false;
        },
        getRefreshToken() {
          return { client: {}, user: {} };
        },
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });

      return handler
        .revokeToken(token, client)
        .then(should.fail)
        .catch(e => {
          e.should.be.an.instanceOf(InvalidTokenError);
          e.message.should.equal('Invalid token: token is invalid');
        });
    });

    // it('should support callbacks', () => {
    //   const token = {};
    //   const client = {};
    //   const model = {
    //     getClient() {},
    //     revokeToken(tokenObject, callback) {
    //       callback(null, null);
    //     },
    //     getRefreshToken(refreshToken, callback) {
    //       callback(null, { client: {}, user: {} });
    //     },
    //     getAccessToken() {},
    //   };
    //   const handler:any = new RevokeHandler({ model });

    //   return handler
    //     .revokeToken(token, client)
    //     .then(should.fail)
    //     .catch(e => {
    //       e.should.be.an.instanceOf(InvalidTokenError);
    //       e.message.should.equal('Invalid token: token is invalid');
    //     });
    // });
  });

  describe('getTokenFromRequest()', () => {
    it('should throw an error if `accessToken` is missing', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
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
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `token`');
      }
    });
  });

  describe('updateErrorResponse()', () => {
    it('should set the `body`', () => {
      const error = new AccessDeniedError('Cannot request a revoke');
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.body.error.should.equal('access_denied');
      response.body.error_description.should.equal('Cannot request a revoke');
    });

    it('should set the `status`', () => {
      const error = new AccessDeniedError('Cannot request a revoke');
      const model = {
        getClient() {},
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      response.status.should.equal(400);
    });
  });
});
