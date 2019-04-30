import * as should from 'should';
import {
  InvalidArgumentError,
  InvalidGrantError,
  InvalidRequestError,
  ServerError,
} from '../../../lib/errors';
import { AuthorizationCodeGrantType } from '../../../lib/grant-types';
import { Request } from '../../../lib/request';

/**
 * Test `AuthorizationCodeGrantType` integration.
 */

describe('AuthorizationCodeGrantType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `model` is missing', () => {
      try {
        new AuthorizationCodeGrantType({ accessTokenLifetime: 3600 });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getAuthorizationCode()`', () => {
      try {
        new AuthorizationCodeGrantType({
          accessTokenLifetime: 3600,
          model: {},
        });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getAuthorizationCode()`',
        );
      }
    });

    it('should throw an error if the model does not implement `revokeAuthorizationCode()`', () => {
      try {
        const model = {
          getAuthorizationCode: () => {},
        };

        new AuthorizationCodeGrantType({ accessTokenLifetime: 3600, model });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `revokeAuthorizationCode()`',
        );
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', () => {
      try {
        const model = {
          getAuthorizationCode: () => {},
          revokeAuthorizationCode: () => {},
        };

        new AuthorizationCodeGrantType({ accessTokenLifetime: 3600, model });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `saveToken()`',
        );
      }
    });
  });

  describe('handle()', () => {
    it('should throw an error if `request` is missing', async () => {
      const model = {
        getAuthorizationCode: () => {},
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });

      try {
        await grantType.handle(undefined, undefined);
        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is invalid', () => {
      const client: any = {};
      const model = {
        getAuthorizationCode() {
          return {
            authorizationCode: 12345,
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
          };
        },
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .handle(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `getAuthorizationCode()` did not return a `client` object',
          );
        });
    });

    it('should throw an error if `client` is missing', async () => {
      const model = {
        getAuthorizationCode: () => {
          return {
            authorizationCode: 12345,
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
          };
        },
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.handle(request, undefined);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', async () => {
      const client: any = { id: 'foobar' };
      const token = {};
      const model = {
        getAuthorizationCode: () => {
          return {
            authorizationCode: 12345,
            client: { id: 'foobar' },
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
          };
        },
        revokeAuthorizationCode: () => {
          return true;
        },
        saveToken: () => {
          return token;
        },
        validateScope: () => {
          return 'foo';
        },
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });
      try {
        const data = await grantType.handle(request, client);
        data.should.equal(token);
      } catch (e) {
        should.fail('should.fail', '');
      }
    });

    it('should support promises', () => {
      const client: any = { id: 'foobar' };
      const model = {
        getAuthorizationCode: () => {
          return Promise.resolve({
            authorizationCode: 12345,
            client: { id: 'foobar' },
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
          });
        },
        revokeAuthorizationCode: () => {
          return true;
        },
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const client: any = { id: 'foobar' };
      const model = {
        getAuthorizationCode: () => {
          return {
            authorizationCode: 12345,
            client: { id: 'foobar' },
            expiresAt: new Date(new Date().getTime() * 2),
            user: {},
          };
        },
        revokeAuthorizationCode: () => {
          return true;
        },
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    // it('should support callbacks', () => {
    //   const client: any = { id: 'foobar' };
    //   const model = {
    //     getAuthorizationCode: (code, callback) => {
    //       callback(undefined, {
    //         authorizationCode: 12345,
    //         client: { id: 'foobar' },
    //         expiresAt: new Date(new Date().getTime() * 2),
    //         user: {},
    //       });
    //     },
    //     revokeAuthorizationCode: (code, callback) => {
    //       callback(undefined, {
    //         authorizationCode: 12345,
    //         client: { id: 'foobar' },
    //         expiresAt: new Date(new Date().getTime() / 2),
    //         user: {},
    //       });
    //     },
    //     saveToken: (tokenToSave, client, user, callback) => {
    //       callback(undefined, tokenToSave);
    //     },
    //   };
    //   const grantType = new AuthorizationCodeGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //   });
    //   const request = new Request({
    //     body: { code: 12345 },
    //     headers: {},
    //     method: {},
    //     query: {},
    //   });

    //   grantType.handle(request, client).should.be.an.instanceOf(Promise);
    // });
  });

  describe('getAuthorizationCode()', () => {
    it('should throw an error if the request body does not contain `code`', async () => {
      const client: any = {};
      const model = {
        getAuthorizationCode: () => {},
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.getAuthorizationCode(request, client);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `code`');
      }
    });

    it('should throw an error if `code` is invalid', async () => {
      const client: any = {};
      const model = {
        getAuthorizationCode: () => {},
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 'øå€£‰' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.getAuthorizationCode(request, client);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `code`');
      }
    });

    it('should throw an error if `authorizationCode` is missing', () => {
      const client: any = {};
      const model = {
        getAuthorizationCode: () => {},
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal(
            'Invalid grant: authorization code is invalid',
          );
        });
    });

    it('should throw an error if `authorizationCode.client` is missing', () => {
      const client: any = {};
      const model = {
        getAuthorizationCode: () => {
          return { authorizationCode: 12345 };
        },
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `getAuthorizationCode()` did not return a `client` object',
          );
        });
    });

    it('should throw an error if `authorizationCode.expiresAt` is missing', () => {
      const client: any = {};
      const model = {
        getAuthorizationCode: () => {
          return { authorizationCode: 12345, client: {}, user: {} };
        },
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `expiresAt` must be a Date instance',
          );
        });
    });

    it('should throw an error if `authorizationCode.user` is missing', () => {
      const client: any = {};
      const model = {
        getAuthorizationCode: () => {
          return {
            authorizationCode: 12345,
            client: {},
            expiresAt: new Date(),
          };
        },
        revokeAuthorizationCode: () => {},
        saveToken: () => {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `getAuthorizationCode()` did not return a `user` object',
          );
        });
    });

    it('should throw an error if the client id does not match', () => {
      const client: any = { id: 123 };
      const model = {
        getAuthorizationCode() {
          return {
            authorizationCode: 12345,
            expiresAt: new Date(),
            client: { id: 456 },
            user: {},
          };
        },
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal(
            'Invalid grant: authorization code is invalid',
          );
        });
    });

    it('should throw an error if the auth code is expired', () => {
      const client: any = { id: 123 };
      const date = new Date(new Date().getTime() / 2);
      const model = {
        getAuthorizationCode() {
          return {
            authorizationCode: 12345,
            client: { id: 123 },
            expiresAt: date,
            user: {},
          };
        },
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal(
            'Invalid grant: authorization code has expired',
          );
        });
    });

    it('should throw an error if the `redirectUri` is invalid', () => {
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        redirectUri: 'foobar',
        user: {},
      };
      const client: any = { id: 'foobar' };
      const model = {
        getAuthorizationCode() {
          return authorizationCode;
        },
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal(
            'Invalid grant: `redirect_uri` is not a valid URI',
          );
        });
    });

    it('should return an auth code', () => {
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
      };
      const client: any = { id: 'foobar' };
      const model = {
        getAuthorizationCode() {
          return authorizationCode;
        },
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(data => {
          data.should.equal(authorizationCode);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should support promises', () => {
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
      };
      const client: any = { id: 'foobar' };
      const model = {
        getAuthorizationCode() {
          return Promise.resolve(authorizationCode);
        },
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      grantType
        .getAuthorizationCode(request, client)
        .should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
      };
      const client: any = { id: 'foobar' };
      const model = {
        getAuthorizationCode() {
          return authorizationCode;
        },
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      grantType
        .getAuthorizationCode(request, client)
        .should.be.an.instanceOf(Promise);
    });

    // it('should support callbacks', () => {
    //   const authorizationCode = {
    //     authorizationCode: 12345,
    //     client: { id: 'foobar' },
    //     expiresAt: new Date(new Date().getTime() * 2),
    //     user: {},
    //   };
    //   const client: any = { id: 'foobar' };
    //   const model = {
    //     getAuthorizationCode(code, callback) {
    //       callback(undefined, authorizationCode);
    //     },
    //     revokeAuthorizationCode() {},
    //     saveToken() {},
    //   };
    //   const grantType = new AuthorizationCodeGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //   });
    //   const request = new Request({
    //     body: { code: 12345 },
    //     headers: {},
    //     method: {},
    //     query: {},
    //   });

    //   grantType
    //     .getAuthorizationCode(request, client)
    //     .should.be.an.instanceOf(Promise);
    // });
  });

  describe('validateRedirectUri()', () => {
    it('should throw an error if `redirectUri` is missing', () => {
      const authorizationCode: any = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date().getTime() / 2),
        redirectUri: 'http://foo.bar',
        user: {},
      };
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {
          return authorizationCode;
        },
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal(
          'Invalid request: `redirect_uri` is not a valid URI',
        );
      }
    });

    it('should throw an error if `redirectUri` is invalid', () => {
      const authorizationCode: any = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date().getTime() / 2),
        redirectUri: 'http://foo.bar',
        user: {},
      };
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {
          return true;
        },
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { code: 12345, redirect_uri: 'http://bar.foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid request: `redirect_uri` is invalid');
      }
    });
  });

  describe('revokeAuthorizationCode()', () => {
    it('should revoke the auth code', async () => {
      const authorizationCode: any = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {
          return true;
        },
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      try {
        const data = await grantType.revokeAuthorizationCode(authorizationCode);
        data.should.equal(authorizationCode);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    it('should throw an error when the auth code is invalid', () => {
      const authorizationCode: any = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {
          return false;
        },
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });

      return grantType
        .revokeAuthorizationCode(authorizationCode)
        .then(data => {
          data.should.equal(authorizationCode);
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal(
            'Invalid grant: authorization code is invalid',
          );
        });
    });

    it('should support promises', () => {
      const authorizationCode: any = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {
          return Promise.resolve(true);
        },
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType
        .revokeAuthorizationCode(authorizationCode)
        .should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const authorizationCode: any = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {
          return authorizationCode;
        },
        saveToken() {},
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType
        .revokeAuthorizationCode(authorizationCode)
        .should.be.an.instanceOf(Promise);
    });

    // it('should support callbacks', () => {
    //   const authorizationCode = {
    //     authorizationCode: 12345,
    //     client: {},
    //     expiresAt: new Date(new Date().getTime() / 2),
    //     user: {},
    //   };
    //   const model = {
    //     getAuthorizationCode() {},
    //     revokeAuthorizationCode(code, callback) {
    //       callback(undefined, authorizationCode);
    //     },
    //     saveToken() {},
    //   };
    //   const grantType = new AuthorizationCodeGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //   });

    //   grantType
    //     .revokeAuthorizationCode(authorizationCode)
    //     .should.be.an.instanceOf(Promise);
    // });
  });

  describe('saveToken()', () => {
    it('should save the token', async () => {
      const token: any = {};
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {},
        saveToken() {
          return token;
        },
        validateScope() {
          return 'foo';
        },
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });
      try {
        const data = await grantType.saveToken({}, {} as any, token, '');
        data.should.equal(token);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    it('should support promises', () => {
      const token: any = {};
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {},
        saveToken() {
          return Promise.resolve(token);
        },
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType
        .saveToken({}, {} as any, token, '')
        .should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const token: any = {};
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {},
        saveToken() {
          return token;
        },
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType
        .saveToken({}, {} as any, token, '')
        .should.be.an.instanceOf(Promise);
    });

    /*    it('should support callbacks', () => {
      const token = {};
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode() {},
        saveToken(tokenToSave, client, user, callback) {
          callback(undefined, token);
        },
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.saveToken({}, {}, token, '').should.be.an.instanceOf(Promise);
    }); */
  });
});
