
/**
 * Module dependencies.
 */

var Response = require('../../lib/response');

/**
 * Test `Response`.
 */

describe('Response', function() {
  describe('constructor()', function() {
    it('should set the `body`', function() {
      var response = new Response({ body: 'foo', headers: {} });

      response.body.should.equal('foo');
    });

    it('should set the `headers`', function() {
      var response = new Response({ body: {}, headers: 'bar' });

      response.headers.should.equal('bar');
    });

    it('should set the `status` to 200', function() {
      var response = new Response({ body: {}, headers: {} });

      response.status.should.equal(200);
    });
  });

  describe('redirect()', function() {
    it('should set the location header to `url`', function() {
      var response = new Response({ body: {}, headers: {} });

      response.redirect('http://example.com');

      response.headers.should.eql({ Location: 'http://example.com' });
    });

    it('should set the `status` to 302', function() {
      var response = new Response({ body: {}, headers: {} });

      response.redirect('http://example.com');

      response.status.should.equal(302);
    });
  });

  describe('set()', function() {
    it('should set the `field`', function() {
      var response = new Response({ body: {}, headers: {} });

      response.set('foo', 'bar');

      response.headers.should.eql({ foo: 'bar' });
    });
  });
});
