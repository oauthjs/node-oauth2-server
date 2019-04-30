import * as should from 'should';
import { InvalidArgumentError, InvalidGrantError } from '../../../lib/errors';
import { ClientCredentialsGrantType } from '../../../lib/grant-types';
import { Request } from '../../../lib/request';

/**
 * Test `ClientCredentialsGrantType` integration.
 */

describe('ClientCredentialsGrantType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `model` is missing', () => {
      try {
        new ClientCredentialsGrantType({ accessTokenLifetime: 3600 });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getUserFromClient()`', () => {
      try {
        new ClientCredentialsGrantType({
          accessTokenLifetime: 3600,
          model: {},
        });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getUserFromClient()`',
        );
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', () => {
      try {
        const model = {
          getUserFromClient() {},
        };

        new ClientCredentialsGrantType({ accessTokenLifetime: 3600, model });

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
        getUserFromClient() {},
        saveToken() {},
      };
      const grantType = new ClientCredentialsGrantType({
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
        getUserFromClient() {},
        saveToken() {},
      };
      const grantType = new ClientCredentialsGrantType({
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
      const token = {};
      const model = {
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
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .handle(request, {} as any)
        .then(data => {
          data.should.equal(token);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });

    it('should support promises', () => {
      const token = {};
      const model = {
        getUserFromClient() {
          return {};
        },
        saveToken() {
          return token;
        },
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, {} as any).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const token = {};
      const model = {
        getUserFromClient() {
          return {};
        },
        saveToken() {
          return token;
        },
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, {} as any).should.be.an.instanceOf(Promise);
    });
  });

  describe('getUserFromClient()', () => {
    it('should throw an error if `user` is missing', () => {
      const model = {
        getUserFromClient() {},
        saveToken() {},
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .getUserFromClient({} as any)
        .then(() => {
          should.fail('should.fail', '');
        })
        .catch((e: any) => {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: user credentials are invalid');
        });
    });

    it('should return a user', async () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient() {
          return user;
        },
        saveToken() {},
      };
      const grantType = new ClientCredentialsGrantType({
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
        const data = await grantType.getUserFromClient({} as any);
        data.should.equal(user);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    it('should support promises', () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient() {
          return Promise.resolve(user);
        },
        saveToken() {},
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      grantType.getUserFromClient({} as any).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient() {
          return user;
        },
        saveToken() {},
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      grantType.getUserFromClient({} as any).should.be.an.instanceOf(Promise);
    });

    /*   it('should support callbacks', () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient(userId, callback) {
          callback(null, user);
        },
        saveToken() {},
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      grantType.getUserFromClient({}).should.be.an.instanceOf(Promise);
    }); */
  });

  describe('saveToken()', () => {
    it('should save the token', async () => {
      const token: any = {};
      const model = {
        getUserFromClient() {},
        saveToken() {
          return token;
        },
        validateScope() {
          return 'foo';
        },
      };
      const grantType = new ClientCredentialsGrantType({
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
        getUserFromClient() {},
        saveToken() {
          return Promise.resolve(token);
        },
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType
        .saveToken({}, {} as any, token)
        .should.be.an.instanceOf(Promise);
    });

    /*  it('should support non-promises', () => {
      const token = {};
      const model = {
        getUserFromClient() {},
        saveToken() {
          return token;
        },
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    }); */

    /*    it('should support callbacks', () => {
      const token = {};
      const model = {
        getUserFromClient() {},
        saveToken(tokenToSave, client, user, callback) {
          callback(null, token);
        },
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    }); */
  });
});
