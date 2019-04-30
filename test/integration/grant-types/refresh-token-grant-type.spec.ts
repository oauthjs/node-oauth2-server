import * as should from 'should';
import {
  InvalidArgumentError,
  InvalidGrantError,
  InvalidRequestError,
  ServerError,
} from '../../../lib/errors';
import { RefreshTokenGrantType } from '../../../lib/grant-types';
import { Request } from '../../../lib/request';

/**
 * Test `RefreshTokenGrantType` integration.
 */

describe('RefreshTokenGrantType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `model` is missing', () => {
      try {
        new RefreshTokenGrantType({ accessTokenLifetime: 3600 });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getRefreshToken()`', () => {
      try {
        new RefreshTokenGrantType({ accessTokenLifetime: 3600, model: {} });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getRefreshToken()`',
        );
      }
    });

    it('should throw an error if the model does not implement `revokeToken()`', () => {
      try {
        const model = {
          async getRefreshToken() {},
        };

        new RefreshTokenGrantType({ accessTokenLifetime: 3600, model });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `revokeToken()`',
        );
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', () => {
      try {
        const model = {
          async getRefreshToken() {},
          async revokeToken() {},
        };

        new RefreshTokenGrantType({ accessTokenLifetime: 3600, model });

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
        getRefreshToken: () => {},
        revokeToken: () => {},
        saveToken: () => {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
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

    it('should throw an error if `client` is missing', async () => {
      const model = {
        getRefreshToken: () => {},
        revokeToken: () => {},
        saveToken: () => {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.handle(request, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', () => {
      const client: any = { id: 123 };
      const token: any = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: () => {
          return token;
        },
        revokeToken: () => {
          return {
            accessToken: 'foo',
            client: { id: 123 },
            refreshTokenExpiresAt: new Date(new Date().getTime() / 2),
            user: {},
          };
        },
        saveToken: () => {
          return token;
        },
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .handle(request, client)
        .then(data => {
          data.should.equal(token);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should support promises', () => {
      const client: any = { id: 123 };
      const model = {
        getRefreshToken() {
          return Promise.resolve({
            accessToken: 'foo',
            client: { id: 123 },
            user: {},
          });
        },
        revokeToken() {
          return Promise.resolve({
            accessToken: 'foo',
            client: {},
            refreshTokenExpiresAt: new Date(new Date().getTime() / 2),
            user: {},
          });
        },
        saveToken() {
          return Promise.resolve({ accessToken: 'foo', client: {}, user: {} });
        },
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    /*     it('should support non-promises', () => {
      const client : any= { id: 123 };
      const model = {
        getRefreshToken() {
          return { accessToken: 'foo', client: { id: 123 }, user: {} };
        },
        revokeToken() {
          return {
            accessToken: 'foo',
            client: {},
            refreshTokenExpiresAt: new Date(new Date() / 2),
            user: {},
          };
        },
        saveToken() {
          return { accessToken: 'foo', client: {}, user: {} };
        },
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    }); */

    /*     it('should support callbacks', () => {
      const client : any= { id: 123 };
      const model = {
        getRefreshToken(refreshToken, callback) {
          callback(null, { accessToken: 'foo', client: { id: 123 }, user: {} });
        },
        revokeToken(refreshToken, callback) {
          callback(null, {
            accessToken: 'foo',
            client: {},
            refreshTokenExpiresAt: new Date(new Date() / 2),
            user: {},
          });
        },
        saveToken(tokenToSave, client, user, callback) {
          callback(null, { accessToken: 'foo', client: {}, user: {} });
        },
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    }); */
  });

  describe('getRefreshToken()', () => {
    it('should throw an error if the `refreshToken` parameter is missing from the request body', async () => {
      const client: any = {};
      const model = {
        getRefreshToken: () => {},
        revokeToken: () => {},
        saveToken: () => {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refreshToken` is not found', () => {
      const client: any = { id: 123 };
      const model = {
        getRefreshToken() {
          return;
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: '12345' },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refreshToken.client` is missing', () => {
      const client: any = {};
      const model = {
        getRefreshToken() {
          return {};
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `getRefreshToken()` did not return a `client` object',
          );
        });
    });

    it('should throw an error if `refreshToken.user` is missing', () => {
      const client: any = {};
      const model = {
        getRefreshToken() {
          return { accessToken: 'foo', client: {} };
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `getRefreshToken()` did not return a `user` object',
          );
        });
    });

    it('should throw an error if the client id does not match', () => {
      const client: any = { id: 123 };
      const model = {
        getRefreshToken() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` contains invalid characters', async () => {
      const client: any = {};
      const model = {
        getRefreshToken() {
          return { client: { id: 456 }, user: {} };
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'øå€£‰' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.getRefreshToken(request, client);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refresh_token` is missing', () => {
      const client: any = {};
      const model = {
        getRefreshToken() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` is expired', () => {
      const client: any = { id: 123 };
      const date = new Date(new Date().getTime() / 2);
      const model = {
        getRefreshToken() {
          return {
            accessToken: 'foo',
            client: { id: 123 },
            refreshTokenExpiresAt: date,
            user: {},
          };
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token has expired');
        });
    });

    it('should throw an error if `refreshTokenExpiresAt` is not a date value', () => {
      const client: any = { id: 123 };
      const model = {
        getRefreshToken() {
          return {
            accessToken: 'foo',
            client: { id: 123 },
            refreshTokenExpiresAt: 'stringValue',
            user: {},
          };
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal(
            'Server error: `refreshTokenExpiresAt` must be a Date instance',
          );
        });
    });

    it('should return a token', () => {
      const client: any = { id: 123 };
      const token: any = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken() {
          return token;
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getRefreshToken(request, client)
        .then(data => {
          data.should.equal(token);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should support promises', () => {
      const client: any = { id: 123 };
      const token: any = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken() {
          return Promise.resolve(token);
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType
        .getRefreshToken(request, client)
        .should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const client: any = { id: 123 };
      const token: any = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken() {
          return token;
        },
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType
        .getRefreshToken(request, client)
        .should.be.an.instanceOf(Promise);
    });

    // it('should support callbacks', () => {
    //   const client : any= { id: 123 };
    //   const token : any= { accessToken: 'foo', client: { id: 123 }, user: {} };
    //   const model = {
    //     getRefreshToken(refreshToken, callback) {
    //       callback(undefined, token);
    //     },
    //     revokeToken() {},
    //     saveToken() {},
    //   };
    //   const grantType = new RefreshTokenGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //   });
    //   const request = new Request({
    //     body: { refresh_token: 'foobar' },
    //     headers: {},
    //     method: {},
    //     query: {},
    //   });

    //   grantType
    //     .getRefreshToken(request, client)
    //     .should.be.an.instanceOf(Promise);
    // });
  });

  describe('revokeToken()', () => {
    it('should throw an error if the `token` is invalid', () => {
      const model = {
        getRefreshToken() {},
        revokeToken() {},
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model,
      });

      grantType
        .revokeToken({} as any)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch(e => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should revoke the token', () => {
      const token: any = {
        accessToken: 'foo',
        client: {},
        refreshTokenExpiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getRefreshToken() {},
        revokeToken() {
          return token;
        },
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });

      return grantType
        .revokeToken(token)
        .then(data => {
          data.should.equal(token);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should support promises', () => {
      const token: any = {
        accessToken: 'foo',
        client: {},
        refreshTokenExpiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getRefreshToken() {},
        revokeToken() {
          return Promise.resolve(token);
        },
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const token: any = {
        accessToken: 'foo',
        client: {},
        refreshTokenExpiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getRefreshToken() {},
        revokeToken() {
          return token;
        },
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });

    /*  it('should support callbacks', () => {
      const token : any= {
        accessToken: 'foo',
        client: {},
        refreshTokenExpiresAt: new Date(new Date().getTime() / 2),
        user: {},
      };
      const model = {
        getRefreshToken() {},
        revokeToken(refreshToken, callback) {
          callback(undefined, token);
        },
        saveToken() {},
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    }); */
  });

  describe('saveToken()', () => {
    it('should save the token', async () => {
      const token: any = {};
      const model = {
        getRefreshToken() {},
        revokeToken() {},
        saveToken() {
          return token;
        },
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });
      try {
        const data = await grantType.saveToken({}, {} as any, token);
        data.should.equal(token);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    it('should support promises', () => {
      const token: any = {};
      const model = {
        getRefreshToken() {},
        revokeToken() {},
        saveToken() {
          return Promise.resolve(token);
        },
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType
        .saveToken({}, {} as any, token)
        .should.be.an.instanceOf(Promise);
    });

    // it('should support non-promises', () => {
    //   const token : any= {};
    //   const model = {
    //     getRefreshToken() {},
    //     revokeToken() {},
    //     saveToken() {
    //       return token;
    //     },
    //   };
    //   const grantType = new RefreshTokenGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //   });

    //   grantType.saveToken(token).should.be.an.instanceOf(Promise);
    // });

    // it('should support callbacks', () => {
    //   const token : any= {};
    //   const model = {
    //     getRefreshToken() {},
    //     revokeToken() {},
    //     saveToken(tokenToSave, client, user, callback) {
    //       callback(null, token);
    //     },
    //   };
    //   const grantType = new RefreshTokenGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //   });

    //   grantType.saveToken(token).should.be.an.instanceOf(Promise);
    // });
  });
});
