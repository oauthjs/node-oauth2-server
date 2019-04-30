import * as should from 'should';
import { InvalidArgumentError } from '../../../lib/errors';
import { BearerTokenType } from '../../../lib/token-types';

/**
 * Test `BearerTokenType` integration.
 */

describe('BearerTokenType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `accessToken` is missing', () => {
      try {
        new BearerTokenType(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        );

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `accessToken`');
      }
    });

    it('should set the `accessToken`', () => {
      const responseType = new BearerTokenType(
        'foo',
        'bar' as any,
        undefined,
        undefined,
        undefined,
      );

      responseType.accessToken.should.equal('foo');
    });

    it('should set the `accessTokenLifetime`', () => {
      const responseType = new BearerTokenType(
        'foo',
        'bar' as any,
        undefined,
        undefined,
        undefined,
      );

      responseType.accessTokenLifetime.should.equal('bar');
    });

    it('should set the `refreshToken`', () => {
      const responseType = new BearerTokenType(
        'foo',
        'bar' as any,
        'biz',
        undefined,
        undefined,
      );

      responseType.refreshToken.should.equal('biz');
    });
  });

  describe('valueOf()', () => {
    it('should return the value representation', () => {
      const responseType = new BearerTokenType(
        'foo',
        'bar' as any,
        undefined,
        undefined,
        undefined,
      );
      const value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        token_type: 'Bearer',
      });
    });

    it('should not include the `expires_in` if not given', () => {
      const responseType = new BearerTokenType(
        'foo',
        undefined,
        undefined,
        undefined,
        undefined,
      );
      const value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        token_type: 'Bearer',
      });
    });

    it('should set `refresh_token` if `refreshToken` is defined', () => {
      const responseType = new BearerTokenType(
        'foo',
        'bar' as any,
        'biz',
        undefined,
        undefined,
      );
      const value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer',
      });
    });

    it('should set `expires_in` if `accessTokenLifetime` is defined', () => {
      const responseType = new BearerTokenType(
        'foo',
        'bar' as any,
        'biz',
        undefined,
        undefined,
      );
      const value = responseType.valueOf();

      value.should.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer',
      });
    });
  });
});
