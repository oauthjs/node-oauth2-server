'use strict';

/**
 * Module dependencies.
 */

var Request = require('../../lib/request');
var InvalidArgumentError = require('../../lib/errors/invalid-argument-error');
var should = require('should');

/**
 * Test `Request` integration.
 */

describe('Request integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `headers` is missing', function() {
      try {
        new Request({ body: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `headers`');
      }
    });

    it('should throw an error if `method` is missing', function() {
      try {
        new Request({ body: {}, headers: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `method`');
      }
    });

    it('should throw an error if `query` is missing', function() {
      try {
        new Request({ body: {}, headers: {}, method: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `query`');
      }
    });

    it('should set the `body`', function() {
      var request = new Request({ body: 'foo', headers: {}, method: {}, query: {} });

      request.body.should.equal('foo');
    });

    it('should set the `headers`', function() {
      var request = new Request({ body: {}, headers: { foo: 'bar', QuX: 'biz' }, method: {}, query: {} });

      request.headers.should.eql({ foo: 'bar', qux: 'biz' });
    });

    it('should set the `method`', function() {
      var request = new Request({ body: {}, headers: {}, method: 'biz', query: {} });

      request.method.should.equal('biz');
    });

    it('should set the `query`', function() {
      var request = new Request({ body: {}, headers: {}, method: {}, query: 'baz' });

      request.query.should.equal('baz');
    });
  });

  describe('get()', function() {
    it('should return `undefined` if the field does not exist', function() {
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      (undefined === request.get('content-type')).should.be.true;
    });

    it('should return the value if the field exists', function() {
      var request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8'
        },
        method: {},
        query: {}
      });

      request.get('Content-Type').should.equal('text/html; charset=utf-8');
    });
  });

  describe('is()', function() {
    it('should accept an array of `types`', function() {
      var request = new Request({
        body: {},
        headers: {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      request.is(['html', 'json']).should.equal('json');
    });

    it('should accept multiple `types` as arguments', function() {
      var request = new Request({
        body: {},
        headers: {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      request.is('html', 'json').should.equal('json');
    });

    it('should return the first matching type', function() {
      var request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      request.is('html').should.equal('html');
    });

    it('should return `false` if none of the `types` match', function() {
      var request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      request.is('json').should.be.false;
    });

    it('should return `false` if the request has no body', function() {
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      request.is('text/html').should.be.false;
    });
  });
});
