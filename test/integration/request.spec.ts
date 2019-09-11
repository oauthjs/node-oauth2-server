import { isUndefined } from 'lodash';
import * as should from 'should';
import { InvalidArgumentError } from '../../lib/errors';
import { Request } from '../../lib/request';

/**
 * Test `Request` integration.
 */

describe('Request integration', () => {
  describe('constructor()', () => {
    it('should throw an error if `headers` is missing', () => {
      try {
        new Request({ body: {} } as any);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `headers`');
      }
    });

    it('should throw an error if `method` is missing', () => {
      try {
        new Request({ body: {}, headers: {} } as any);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `method`');
      }
    });

    it('should throw an error if `query` is missing', () => {
      try {
        new Request({ body: {}, headers: {}, method: 'ANY' } as any);

        should.fail('should.fail', '');
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `query`');
      }
    });

    it('should set the `body`', () => {
      const request = new Request({
        body: 'foo',
        headers: {},
        method: 'ANY',
        query: {},
      });

      request.body.should.equal('foo');
    });

    it('should set the `headers`', () => {
      const request = new Request({
        body: {},
        headers: { foo: 'bar', QuX: 'biz' },
        method: 'ANY',
        query: {},
      });

      request.headers.should.eql({ foo: 'bar', qux: 'biz' });
    });

    it('should set the `method`', () => {
      const request = new Request({
        body: {},
        headers: {},
        method: 'biz',
        query: {},
      });

      request.method.should.equal('BIZ');
    });

    it('should set the `query`', () => {
      const request = new Request({
        body: {},
        headers: {},
        method: 'ANY',
        query: 'baz',
      });

      request.query.should.equal('baz');
    });
  });

  describe('get()', () => {
    it('should return `undefined` if the field does not exist', () => {
      const request = new Request({
        body: {},
        headers: {},
        method: 'ANY',
        query: {},
      });

      isUndefined(request.get('content-type')).should.be.true();
    });

    it('should return the value if the field exists', () => {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
        method: 'ANY',
        query: {},
      });

      request.get('Content-Type').should.equal('text/html; charset=utf-8');
    });
  });

  describe('is()', () => {
    it('should accept an array of `types`', () => {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
        },
        method: 'ANY',
        query: {},
      });

      request.is(['html', 'json']).should.equal('json');
    });

    it('should accept multiple `types` as arguments', () => {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
        },
        method: 'ANY',
        query: {},
      });

      request.is('html', 'json').should.equal('json');
    });

    it('should return the first matching type', () => {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'transfer-encoding': 'chunked',
        },
        method: 'ANY',
        query: {},
      });

      request.is('html').should.equal('html');
    });

    it('should return `false` if none of the `types` match', () => {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'transfer-encoding': 'chunked',
        },
        method: 'ANY',
        query: {},
      });

      request.is('json').should.be.false();
    });

    it('should return `false` if the request has no body', () => {
      const request = new Request({
        body: {},
        headers: {},
        method: 'ANY',
        query: {},
      });

      request.is('text/html').should.be.false();
    });
  });
});
