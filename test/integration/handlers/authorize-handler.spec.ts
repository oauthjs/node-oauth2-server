import * as should from 'should';
import * as url from 'url';
import {
  AccessDeniedError,
  InvalidArgumentError,
  InvalidClientError,
  InvalidRequestError,
  InvalidScopeError,
  ServerError,
  UnauthorizedClientError,
} from '../../../lib/errors';
import { AuthenticateHandler, AuthorizeHandler } from '../../../lib/handlers';
import { Request } from '../../../lib/request';
import { Response } from '../../../lib/response';
import { CodeResponseType } from '../../../lib/response-types';

/**
 * Test `AuthorizeHandler` integration.
 */

describe('AuthorizeHandler integration', () => {
  describe('constructor()', () => {
    // Move to Code Response Type
    // it('should throw an error if `options.authorizationCodeLifetime` is missing', () => {
    //   try {
    //     new AuthorizeHandler({ model: {} });

    //     should.fail('should.fail', '');
    //   } catch (e) {
    //     e.should.be.an.instanceOf(InvalidArgumentError);
    //     e.message.should.equal(
    //       'Missing parameter: `authorizationCodeLifetime`',
    //     );
    //   }
    // });

    it('should throw an error if `options.model` is missing', () => {
      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120 });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getClient()`', () => {
      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120, model: {} });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getClient()`',
        );
      }
    });

    // Move to Code Response Type
    // it('should throw an error if the model does not implement `saveAuthorizationCode()`', () => {
    //   try {
    //     new AuthorizeHandler({
    //       authorizationCodeLifetime: 120,
    //       model: { getClient: () => {} },
    //     });

    //     should.fail('should.fail', '');
    //   } catch (e) {
    //     e.should.be.an.instanceOf(InvalidArgumentError);
    //     e.message.should.equal(
    //       'Invalid argument: model does not implement `saveAuthorizationCode()`',
    //     );
    //   }
    // });

    it('should throw an error if the model does not implement `getAccessToken()`', () => {
      const model = {
        getClient: () => {},
        saveAuthorizationCode: () => {},
      };

      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getAccessToken()`',
        );
      }
    });

    // it('should set the `authorizationCodeLifetime`', () => {
    //   const model = {
    //     getAccessToken: () => {},
    //     getClient: () => {},
    //     saveAuthorizationCode: () => {},
    //   };
    //   const handler = new AuthorizeHandler({
    //     authorizationCodeLifetime: 120,
    //     model,
    //   });

    //   handler.authorizationCodeLifetime.should.equal(120);
    // });

    it('should set the `authenticateHandler`', () => {
      const model = {
        getAccessToken: () => {},
        getClient: () => {},
        saveAuthorizationCode: () => {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });

      handler.authenticateHandler.should.be.an.instanceOf(AuthenticateHandler);
    });

    it('should set the `model`', () => {
      const model = {
        getAccessToken: () => {},
        getClient: () => {},
        saveAuthorizationCode: () => {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });

      handler.model.should.equal(model);
    });
  });

  describe('handle()', () => {
    it('should throw an error if `request` is missing', async () => {
      const model = {
        getAccessToken: () => {},
        getClient: () => {},
        saveAuthorizationCode: () => {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
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
        getAccessToken: () => {},
        getClient: () => {},
        saveAuthorizationCode: () => {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
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

    it('should throw an error if `allowed` is `false`', () => {
      const model = {
        getAccessToken: () => {},
        getClient: () => {},
        saveAuthorizationCode: () => {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: { allowed: 'false' },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(AccessDeniedError);
          e.message.should.equal(
            'Access denied: user denied access to application',
          );
        });
    });

    it('should redirect to an error response if a non-oauth error is thrown', () => {
      const model = {
        getAccessToken: () => {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient: () => {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode: () => {
          throw new Error('Unhandled exception');
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {
          state: 'foobar',
        },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(() => {
          response
            .get('location')
            .should.equal(
              'http://example.com/cb?error=server_error&error_description=Unhandled%20exception&state=foobar',
            );
        });
    });

    it('should redirect to an error response if an oauth error is thrown', () => {
      const model = {
        getAccessToken: () => {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient: () => {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode: () => {
          throw new AccessDeniedError('Cannot request this auth code');
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {
          state: 'foobar',
        },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(() => {
          response.get('location').should.equal(
            // tslint:disable-next-line:max-line-length
            'http://example.com/cb?error=access_denied&error_description=Cannot%20request%20this%20auth%20code&state=foobar',
          );
        });
    });

    it('should redirect to a successful response with `code` and `state` if successful', () => {
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb'],
      };
      const model = {
        getAccessToken: () => {
          return {
            client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient: () => {
          return client;
        },
        saveAuthorizationCode: () => {
          return { authorizationCode: 12345, client };
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {
          state: 'foobar',
        },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          response
            .get('location')
            .should.equal('http://example.com/cb?code=12345&state=foobar');
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should redirect to an error response if `scope` is invalid', () => {
      const model = {
        getAccessToken: () => {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient: () => {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode: () => {
          return {};
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {
          scope: [],
          state: 'foobar',
        },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(() => {
          response
            .get('location')
            .should.equal(
              'http://example.com/cb?error=invalid_scope&error_description=Invalid%20parameter%3A%20%60scope%60',
            );
        });
    });

    it('should redirect to an error response if `state` is missing', () => {
      const model = {
        getAccessToken: () => {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient: () => {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode: () => {
          throw new AccessDeniedError('Cannot request this auth code');
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
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
            .get('location')
            .should.equal(
              'http://example.com/cb?error=invalid_request&error_description=Missing%20parameter%3A%20%60state%60',
            );
        });
    });

    it('should redirect to an error response if `response_type` is invalid', () => {
      const model = {
        getAccessToken: () => {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient: () => {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode: () => {
          return { authorizationCode: 12345, client: {} };
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'test',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {
          state: 'foobar',
        },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(() => {
          response.get('location').should.equal(
            // tslint:disable-next-line:max-line-length
            'http://example.com/cb?error=unsupported_response_type&error_description=Unsupported%20response%20type%3A%20%60response_type%60%20is%20not%20supported&state=foobar',
          );
        });
    });

    it('should fail on invalid `response_type` before calling model.saveAuthorizationCode()', () => {
      const model = {
        getAccessToken: () => {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient: () => {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode: () => {
          throw new Error('must not be reached');
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'test',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {
          state: 'foobar',
        },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(() => {
          response.get('location').should.equal(
            // tslint:disable-next-line:max-line-length
            'http://example.com/cb?error=unsupported_response_type&error_description=Unsupported%20response%20type%3A%20%60response_type%60%20is%20not%20supported&state=foobar',
          );
        });
    });

    it('should return the `code` if successful', () => {
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb'],
      };
      const model = {
        getAccessToken: () => {
          return {
            client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient() {
          return client;
        },
        saveAuthorizationCode() {
          return { authorizationCode: 12345, client };
        },
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
        },
        headers: {
          Authorization: 'Bearer foo',
        },
        method: {},
        query: {
          state: 'foobar',
        },
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(data => {
          data.should.eql({
            authorizationCode: 12345,
            client,
          });
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });
  });

  // describe('generateAuthorizationCode()', () => {
  //   it('should return an auth code', async () => {
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {},
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });
  //     try {
  //       const data: any = await handler.generateAuthorizationCode(
  //         undefined,
  //         undefined,
  //         undefined,
  //       );
  //       data.should.be.a.sha1();
  //     } catch (error) {
  //       should.fail('should.fail', '');
  //     }
  //   });

  //   it('should support promises', async () => {
  //     const model = {
  //       generateAuthorizationCode() {
  //         return Promise.resolve({});
  //       },
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {},
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });
  //     try {
  //       await handler
  //         .generateAuthorizationCode(undefined, undefined, undefined)
  //         .should.be.an.instanceOf(Promise);
  //     } catch (error) {
  //       should.fail('should.fail', '');
  //     }
  //   });

  //   /*  it('should support non-promises', () => {
  //     const model = {
  //       generateAuthorizationCode() {
  //         return {};
  //       },
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {},
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });

  //     handler
  //       .generateAuthorizationCode(undefined, undefined, undefined)
  //       .should.be.an.instanceOf(Promise);
  //   }); */
  // });

  // describe('getAuthorizationCodeLifetime()', () => {
  //   it('should return a date', () => {
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {},
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });

  //     handler.getAuthorizationCodeLifetime().should.be.an.instanceOf(Date);
  //   });
  // });

  describe('getClient()', () => {
    it('should throw an error if `client_id` is missing', async () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { response_type: 'code' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `client_id`');
      }
    });

    it('should throw an error if `client_id` is invalid', async () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 'øå€£‰', response_type: 'code' },
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

    it('should throw an error if `client.redirectUri` is invalid', async () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
          redirect_uri: 'foobar',
        },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await handler.getClient(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal(
          'Invalid request: `redirect_uri` is not a valid URI',
        );
      }
    });

    it('should throw an error if `client` is missing', () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal(
            'Invalid client: client credentials are invalid',
          );
        });
    });

    it('should throw an error if `client.grants` is missing', () => {
      const model = {
        getAccessToken() {},
        getClient() {
          return {};
        },
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal('Invalid client: missing client `grants`');
        });
    });

    it('should throw an error if `client` is unauthorized', () => {
      const model = {
        getAccessToken() {},
        getClient() {
          return { grants: [] };
        },
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(UnauthorizedClientError);
          e.message.should.equal(
            'Unauthorized client: `grant_type` is invalid',
          );
        });
    });

    it('should throw an error if `client.redirectUri` is missing', () => {
      const model = {
        getAccessToken() {},
        getClient() {
          return { grants: ['authorization_code'] };
        },
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal(
            'Invalid client: missing client `redirectUri`',
          );
        });
    });

    it('should throw an error if `client.redirectUri` is not equal to `redirectUri`', () => {
      const model = {
        getAccessToken() {},
        getClient() {
          return {
            grants: ['authorization_code'],
            redirectUris: ['https://example.com'],
          };
        },
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
          redirect_uri: 'https://foobar.com',
        },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidClientError);
          e.message.should.equal(
            'Invalid client: `redirect_uri` does not match client value',
          );
        });
    });

    it('should support promises', async () => {
      const model = {
        getAccessToken() {},
        async getClient() {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {},
      });
      try {
        handler.getClient(request).should.be.an.instanceOf(Promise);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    /*     it('should support non-promises', async () => {
      const model = {
        getAccessToken() {},
        getClient() {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          };
        },
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      await handler.getClient(request).should.be.an.instanceOf(Promise);
    }); */

    /*     it('should support callbacks', () => {
      const model = {
        getAccessToken() {},
        getClient(clientId, clientSecret, callback) {
          should.equal(clientSecret, null);
          callback(null, {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          });
        },
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      handler.getClient(request).should.be.an.instanceOf(Promise);
    }); */

    describe('with `client_id` in the request query', () => {
      it('should return a client', () => {
        const client = {
          grants: ['authorization_code'],
          redirectUris: ['http://example.com/cb'],
        };
        const model = {
          getAccessToken() {},
          getClient() {
            return client;
          },
          saveAuthorizationCode() {},
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model,
        });
        const request = new Request({
          body: { response_type: 'code' },
          headers: {},
          method: {},
          query: { client_id: 12345 },
        });

        return handler
          .getClient(request)
          .then(data => {
            data.should.equal(client);
          })
          .catch(() => {
            should.fail('should.fail', '');
          });
      });
    });
  });

  describe('getScope()', () => {
    it('should throw an error if `scope` is invalid', () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { scope: 'øå€£‰' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        handler.getScope(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidScopeError);
        e.message.should.equal('Invalid parameter: `scope`');
      }
    });

    describe('with `scope` in the request body', () => {
      it('should return the scope', () => {
        const model = {
          getAccessToken() {},
          getClient() {},
          saveAuthorizationCode() {},
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model,
        });
        const request = new Request({
          body: { scope: 'foo' },
          headers: {},
          method: {},
          query: {},
        });

        handler.getScope(request).should.equal('foo');
      });
    });

    describe('with `scope` in the request query', () => {
      it('should return the scope', () => {
        const model = {
          getAccessToken() {},
          getClient() {},
          saveAuthorizationCode() {},
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model,
        });
        const request = new Request({
          body: {},
          headers: {},
          method: {},
          query: { scope: 'foo' },
        });

        handler.getScope(request).should.equal('foo');
      });
    });
  });

  describe('getState()', () => {
    it('should throw an error if `allowEmptyState` is false and `state` is missing', () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        allowEmptyState: false,
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        handler.getState(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `state`');
      }
    });

    it('should throw an error if `state` is invalid', () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: { state: 'øå€£‰' },
      });

      try {
        handler.getState(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `state`');
      }
    });

    describe('with `state` in the request body', () => {
      it('should return the state', () => {
        const model = {
          getAccessToken() {},
          getClient() {},
          saveAuthorizationCode() {},
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model,
        });
        const request = new Request({
          body: { state: 'foobar' },
          headers: {},
          method: {},
          query: {},
        });

        handler.getState(request).should.equal('foobar');
      });
    });

    describe('with `state` in the request query', () => {
      it('should return the state', () => {
        const model = {
          getAccessToken() {},
          getClient() {},
          saveAuthorizationCode() {},
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model,
        });
        const request = new Request({
          body: {},
          headers: {},
          method: {},
          query: { state: 'foobar' },
        });

        handler.getState(request).should.equal('foobar');
      });
    });
  });

  describe('getUser()', () => {
    it('should throw an error if `user` is missing', () => {
      const authenticateHandler = { handle() {} };
      const model = {
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authenticateHandler,
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });
      const response = new Response();

      return handler
        .getUser(request, response)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `handle()` did not return a `user` object',
          );
        });
    });

    it('should return a user', () => {
      const user = {};
      const model = {
        getAccessToken() {
          return {
            user,
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000),
          };
        },
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {},
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .getUser(request, response)
        .then(data => {
          data.should.equal(user);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });
  });

  // describe('saveAuthorizationCode()', () => {
  //   it('should return an auth code', () => {
  //     const authorizationCode = {};
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {
  //         return authorizationCode;
  //       },
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });

  //     return handler
  //       .saveAuthorizationCode(
  //         'foo',
  //         'bar' as any,
  //         'biz',
  //         'baz' as any,
  //         undefined,
  //         undefined,
  //       )
  //       .then(data => {
  //         data.should.equal(authorizationCode);
  //       })
  //       .catch(() => should.fail('should.fail', ''));
  //   });

  //   it('should support promises when calling `model.saveAuthorizationCode()`', () => {
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {
  //         return Promise.resolve({});
  //       },
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });

  //     handler
  //       .saveAuthorizationCode(
  //         'foo',
  //         'bar' as any,
  //         'biz',
  //         'baz' as any,
  //         undefined,
  //         undefined,
  //       )
  //       .should.be.an.instanceOf(Promise);
  //   });

  //   /*    it('should support non-promises when calling `model.saveAuthorizationCode()`', () => {
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {
  //         return {};
  //       },
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });

  //     handler
  //       .saveAuthorizationCode('foo', 'bar', 'biz', 'baz', undefined, undefined)
  //       .should.be.an.instanceOf(Promise);
  //   }); */

  //   /*     it('should support callbacks when calling `model.saveAuthorizationCode()`', () => {
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode(code, client, user, callback) {
  //         return callback(null, true);
  //       },
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });

  //     handler
  //       .saveAuthorizationCode('foo', 'bar', 'biz', 'baz')
  //       .should.be.an.instanceOf(Promise);
  //   }); */
  // });

  // describe('getResponseType()', () => {
  //   it('should throw an error if `response_type` is missing', () => {
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {},
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });
  //     const request = new Request({
  //       body: {},
  //       headers: {},
  //       method: {},
  //       query: {},
  //     });

  //     try {
  //       handler.getResponseType(request);

  //       should.fail('should.fail', '');
  //     } catch (e) {
  //       e.should.be.an.instanceOf(InvalidRequestError);
  //       e.message.should.equal('Missing parameter: `response_type`');
  //     }
  //   });

  //   it('should throw an error if `response_type` is not `code`', () => {
  //     const model = {
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {},
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });
  //     const request = new Request({
  //       body: { response_type: 'foobar' },
  //       headers: {},
  //       method: {},
  //       query: {},
  //     });

  //     try {
  //       handler.getResponseType(request);

  //       should.fail('should.fail', '');
  //     } catch (e) {
  //       e.should.be.an.instanceOf(UnsupportedResponseTypeError);
  //       e.message.should.equal(
  //         'Unsupported response type: `response_type` is not supported',
  //       );
  //     }
  //   });

  //   describe('with `response_type` in the request body', () => {
  //     it('should return a response type', () => {
  //       const model = {
  //         getAccessToken() {},
  //         getClient() {},
  //         saveAuthorizationCode() {},
  //       };
  //       const handler = new AuthorizeHandler({
  //         authorizationCodeLifetime: 120,
  //         model,
  //       });
  //       const request = new Request({
  //         body: { response_type: 'code' },
  //         headers: {},
  //         method: {},
  //         query: {},
  //       });
  //       const ResponseType = handler.getResponseType(request);

  //       ResponseType.should.equal(CodeResponseType);
  //     });
  //   });

  //   describe('with `response_type` in the request query', () => {
  //     it('should return a response type', () => {
  //       const model = {
  //         getAccessToken() {},
  //         getClient() {},
  //         saveAuthorizationCode() {},
  //       };
  //       const handler = new AuthorizeHandler({
  //         authorizationCodeLifetime: 120,
  //         model,
  //       });
  //       const request = new Request({
  //         body: {},
  //         headers: {},
  //         method: {},
  //         query: { response_type: 'code' },
  //       });
  //       const ResponseType = handler.getResponseType(request);

  //       ResponseType.should.equal(CodeResponseType);
  //     });
  //   });
  // });

  describe('buildSuccessRedirectUri()', () => {
    it('should return a redirect uri', () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const responseType = new CodeResponseType({
        authorizationCodeLifetime: 360,
        model: { saveAuthorizationCode: () => {} },
      });
      responseType.code = 12345;
      const redirectUri = handler.buildSuccessRedirectUri(
        'http://example.com/cb',
        responseType,
      );

      url.format(redirectUri).should.equal('http://example.com/cb?code=12345');
    });
  });

  describe('buildErrorRedirectUri()', () => {
    it('should set `error_description` if available', () => {
      const error = new InvalidClientError('foo bar');
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const responseType = new CodeResponseType({
        authorizationCodeLifetime: 360,
        model: { saveAuthorizationCode: () => {} },
      });
      const redirectUri = handler.buildErrorRedirectUri(
        'http://example.com/cb',
        responseType,
        error,
      );

      url
        .format(redirectUri)
        .should.equal(
          'http://example.com/cb?error=invalid_client&error_description=foo%20bar',
        );
    });

    it('should return a redirect uri', () => {
      const error = new InvalidClientError();
      const model = {
        async getAccessToken() {},
        async getClient() {},
        async saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const responseType = new CodeResponseType({
        authorizationCodeLifetime: 360,
        model: { saveAuthorizationCode: () => {} },
      });
      const redirectUri = handler.buildErrorRedirectUri(
        'http://example.com/cb',
        responseType,
        error,
      );

      url
        .format(redirectUri)
        .should.equal(
          'http://example.com/cb?error=invalid_client&error_description=Bad%20Request',
        );
    });
  });

  describe('updateResponse()', () => {
    it('should set the `location` header', () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const responseType = new CodeResponseType({
        authorizationCodeLifetime: 360,
        model: { saveAuthorizationCode: () => {} },
      });
      const response = new Response({ body: {}, headers: {} });
      const uri = url.parse('http://example.com/cb', true);

      handler.updateResponse(response, uri, responseType, 'foobar');

      response
        .get('location')
        .should.equal('http://example.com/cb?state=foobar');
    });
  });
});
