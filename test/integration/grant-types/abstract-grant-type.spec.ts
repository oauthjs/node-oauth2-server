import * as should from 'should';
import { InvalidArgumentError } from '../../../lib/errors';
import { AbstractGrantType } from '../../../lib/grant-types';
import { Request } from '../../../lib/request';
/**
 * Test `AbstractGrantType` integration.
 */
describe('AbstractGrantType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `options.accessTokenLifetime` is missing', () => {
      try {
        new AbstractGrantType();
        should.fail('no error was thrown', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('should throw an error if `options.model` is missing', () => {
      try {
        new AbstractGrantType({ accessTokenLifetime: 123 });
        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should set the `accessTokenLifetime`', () => {
      const grantType = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
      });

      grantType.accessTokenLifetime.should.equal(123);
    });

    it('should set the `model`', () => {
      const model = {};
      const grantType = new AbstractGrantType({
        accessTokenLifetime: 123,
        model,
      });

      grantType.model.should.equal(model);
    });

    it('should set the `refreshTokenLifetime`', () => {
      const grantType = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
      });

      grantType.refreshTokenLifetime.should.equal(456);
    });
  });

  describe('generateAccessToken()', () => {
    it('should return an access token', async () => {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
      });
      try {
        const data: any = await handler.generateAccessToken();
        data.should.be.a.sha1();
      } catch (error) {
        should.fail('should.fail', '');
      }
    });

    it('should support promises', () => {
      const model = {
        generateAccessToken() {
          return Promise.resolve({});
        },
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 456,
      });

      handler.generateAccessToken().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const model = {
        generateAccessToken() {
          return {};
        },
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 456,
      });

      handler.generateAccessToken().should.be.an.instanceOf(Promise);
    });
  });

  describe('generateRefreshToken()', () => {
    it('should return a refresh token', async () => {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
      });
      try {
        const data: any = await handler.generateRefreshToken();
        data.should.be.a.sha1();
      } catch (error) {
        should.fail('should.fail fail', error.message);
      }
    });

    it('should support promises', () => {
      const model = {
        generateRefreshToken() {
          return Promise.resolve({});
        },
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 456,
      });

      handler.generateRefreshToken().should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', () => {
      const model = {
        generateRefreshToken() {
          return {};
        },
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 456,
      });

      handler.generateRefreshToken().should.be.an.instanceOf(Promise);
    });
  });

  describe('getAccessTokenExpiresAt()', () => {
    it('should return a date', () => {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
      });

      handler.getAccessTokenExpiresAt().should.be.an.instanceOf(Date);
    });
  });

  describe('getRefreshTokenExpiresAt()', () => {
    it('should return a refresh token', () => {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
      });

      handler.getRefreshTokenExpiresAt().should.be.an.instanceOf(Date);
    });
  });

  describe('getScope()', () => {
    it('should throw an error if `scope` is invalid', () => {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
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
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid parameter: `scope`');
      }
    });

    it('should allow the `scope` to be `undefined`', () => {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });

      should.not.exist(handler.getScope(request));
    });

    it('should return the scope', () => {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456,
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
});
