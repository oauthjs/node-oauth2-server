import * as should from 'should';
import {
  InvalidArgumentError,
  InvalidGrantError,
  InvalidRequestError,
} from '../../../lib/errors';
import { PasswordGrantType } from '../../../lib/grant-types';
import { Request } from '../../../lib/request';

/**
 * Test `PasswordGrantType` integration.
 */

describe('PasswordGrantType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `model` is missing', () => {
      try {
        new PasswordGrantType({ accessTokenLifetime: 3600 });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getUser()`', () => {
      try {
        new PasswordGrantType({ accessTokenLifetime: 3600, model: {} });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `getUser()`',
        );
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', () => {
      try {
        const model = {
          getUser: () => {},
        };

        new PasswordGrantType({ accessTokenLifetime: 3600, model });

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
        getUser: () => {},
        saveToken: () => {},
      };
      const grantType = new PasswordGrantType({
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

    it('should throw an error if `client` is missing', async () => {
      const model = {
        getUser: () => {},
        saveToken: () => {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });

      try {
        await grantType.handle({}, undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', () => {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: () => {
          return {};
        },
        saveToken: () => {
          return token;
        },
        validateScope: () => {
          return 'baz';
        },
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar', scope: 'baz' },
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
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser() {
          return {};
        },
        saveToken() {
          return Promise.resolve(token);
        },
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser() {
          return {};
        },
        saveToken() {
          return token;
        },
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    /*     it('should support callbacks', () => {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser(username, password, callback) {
          callback(null, {});
        },
        saveToken(tokenToSave, client, user, callback) {
          callback(null, token);
        },
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    }); */
  });

  describe('getUser()', () => {
    it('should throw an error if the request body does not contain `username`', async () => {
      const model = {
        getUser() {},
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
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
        await grantType.getUser(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `username`');
      }
    });

    it('should throw an error if the request body does not contain `password`', async () => {
      const model = {
        getUser() {},
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.getUser(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `password`');
      }
    });

    it('should throw an error if `username` is invalid', async () => {
      const model = {
        getUser() {},
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: '\r\n', password: 'foobar' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.getUser(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `username`');
      }
    });

    it('should throw an error if `password` is invalid', async () => {
      const model = {
        getUser() {},
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foobar', password: '\r\n' },
        headers: {},
        method: {},
        query: {},
      });

      try {
        await grantType.getUser(request);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `password`');
      }
    });

    it('should throw an error if `user` is missing', async () => {
      const model = {
        getUser() {},
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });
      try {
        await grantType.getUser(request);
        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidGrantError);
        e.message.should.equal('Invalid grant: user credentials are invalid');
      }
    });

    it('should return a user', async () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser() {
          return user;
        },
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });
      try {
        const data = await grantType.getUser(request);
        data.should.equal(user);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    it('should support promises', () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser() {
          return Promise.resolve(user);
        },
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser() {
          return user;
        },
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    });

    /*     it('should support callbacks', () => {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUser(username, password, callback) {
          callback(null, user);
        },
        saveToken() {},
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });

      grantType.getUser(request).should.be.an.instanceOf(Promise);
    }); */
  });

  describe('saveToken()', () => {
    it('should save the token', async () => {
      const token: any = {};
      const model = {
        getUser() {},
        saveToken() {
          return token;
        },
        validateScope() {
          return 'foo';
        },
      };
      const grantType = new PasswordGrantType({
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
        getUser() {},
        saveToken() {
          return Promise.resolve(token);
        },
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType
        .saveToken({}, {} as any, token)
        .should.be.an.instanceOf(Promise);
    });

    /*     it('should support non-promises', () => {
      const token = {};
      const model = {
        getUser() {},
        saveToken() {
          return token;
        },
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    }); */

    /*     it('should support callbacks', () => {
      const token = {};
      const model = {
        getUser() {},
        saveToken(tokenToSave, client, user, callback) {
          callback(null, token);
        },
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.saveToken({}, {}, token).should.be.an.instanceOf(Promise);
    }); */
  });
});
