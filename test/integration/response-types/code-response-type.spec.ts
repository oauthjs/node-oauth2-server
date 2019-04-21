import * as should from 'should';
import * as url from 'url';
import { InvalidArgumentError } from '../../../lib/errors/invalid-argument-error';
import { CodeResponseType } from '../../../lib/response-types/code-response-type';

/**
 * Test `CodeResponseType` integration.
 */

describe('CodeResponseType integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `code` is missing', () => {
      try {
        new CodeResponseType(undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `code`');
      }
    });

    it('should set the `code`', () => {
      const responseType = new CodeResponseType('foo' as any);

      responseType.code.should.equal('foo');
    });
  });

  describe('buildRedirectUri()', () => {
    it('should throw an error if the `redirectUri` is missing', () => {
      const responseType = new CodeResponseType('foo' as any);

      try {
        responseType.buildRedirectUri(undefined);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `redirectUri`');
      }
    });

    it('should return the new redirect uri and set the `code` and `state` in the query', () => {
      const responseType = new CodeResponseType('foo' as any);
      const redirectUri = responseType.buildRedirectUri(
        'http://example.com/cb',
      );

      url.format(redirectUri).should.equal('http://example.com/cb?code=foo');
    });

    it('should return the new redirect uri and append the `code` and `state` in the query', () => {
      const responseType = new CodeResponseType('foo' as any);
      const redirectUri = responseType.buildRedirectUri(
        'http://example.com/cb?foo=bar',
      );

      url
        .format(redirectUri)
        .should.equal('http://example.com/cb?foo=bar&code=foo');
    });
  });
});
