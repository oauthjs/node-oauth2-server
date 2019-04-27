import { InvalidArgumentError, Request } from 'index';
import * as should from 'should';
import { ImplicitGrantType } from '../../../lib/grant-types/implicit-grant-type';

/**
 * Test `ImplicitGrantType` integration.
 */

describe('ImplicitGrantType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `model` is missing', () => {
      try {
        new ImplicitGrantType();

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', () => {
      try {
        const model = {};

        new ImplicitGrantType({ model });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal(
          'Invalid argument: model does not implement `saveToken()`',
        );
      }
    });

    it('should throw an error if the `user` parameter is missing', () => {
      try {
        const model = {
          saveToken() {},
        };

        new ImplicitGrantType({ model });

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `user`');
      }
    });
  });

  describe('handle()', () => {
    it('should throw an error if `request` is missing', () => {
      const model = {
        saveToken() {},
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
      });

      try {
        grantType.handle();

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', () => {
      const model = {
        saveToken() {},
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      try {
        grantType.handle(request, undefined);
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', () => {
      const client = { id: 'foobar' };
      const token = { accessToken: 'foobar-token' };
      const model = {
        saveToken() {
          return token;
        },
        validateScope() {
          return 'foo';
        },
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });

      return grantType
        .handle(request, client)
        .then(data => {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', () => {
      const client = { id: 'foobar' };
      const model = {
        saveToken() {},
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
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
      const client = { id: 'foobar' };
      const model = {
        saveToken() {},
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
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
    //   const client = { id: 'foobar' };
    //   const model = {
    //     saveToken(tokenToSave, client, user, callback) {
    //       callback(null, tokenToSave);
    //     },
    //   };
    //   const grantType:any = new ImplicitGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //     user: {},
    //   });
    //   const request = new Request({
    //     body: { code: 12345 },
    //     headers: {},
    //     method: {},
    //     query: {},
    //   });

    //   grantType.handle(request, client).should.be.an.instanceOf(Promise);
    //   grantType.handle(request, client).then(data => {
    //     data.should.have.keys('accessToken', 'accessTokenExpiresAt');
    //     data.accessToken.should.be.type('string');
    //   });
    // });
  });

  describe('saveToken()', () => {
    it('should save the token', () => {
      const token = {};
      const model = {
        saveToken() {
          return token;
        },
        validateScope() {
          return 'foo';
        },
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
      });

      return grantType
        .saveToken(token)
        .then(data => {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', () => {
      const token = {};
      const model = {
        saveToken() {
          return Promise.resolve(token);
        },
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const token = {};
      const model = {
        saveToken() {
          return token;
        },
      };
      const grantType: any = new ImplicitGrantType({
        accessTokenLifetime: 123,
        model,
        user: {},
      });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    // it('should support callbacks', () => {
    //   const token = {};
    //   const model = {
    //     saveToken(tokenToSave, client, user, callback) {
    //       callback(null, token);
    //     },
    //   };
    //   const grantType:any = new ImplicitGrantType({
    //     accessTokenLifetime: 123,
    //     model,
    //     user: {},
    //   });

    //   grantType.saveToken(token).should.be.an.instanceOf(Promise);
    // });
  });
});
