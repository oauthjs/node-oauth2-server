'use strict';

/**
 * Module dependencies.
 */

var Response = require('../../lib/response');
var should = require('should');

/**
 * Test `Request`.
 */

function generateBaseResponse() {
  return {
    headers: {
      bar: 'foo'
    },
    body: {
      foobar: 'barfoo'
    }
  };
}

describe('Request', function() {
  it('should instantiate with a basic request', function() {
    var originalResponse = generateBaseResponse();

    var response = new Response(originalResponse);
    response.headers.should.eql(originalResponse.headers);
    response.body.should.eql(originalResponse.body);
    response.status.should.eql(200);
  });

  it('should allow a response to be passed without a body', function() {
    var originalResponse = generateBaseResponse();
    delete originalResponse.body;

    var response = new Response(originalResponse);
    response.headers.should.eql(originalResponse.headers);
    response.body.should.eql({});
    response.status.should.eql(200);
  });

  it('should allow a response to be passed without headers', function() {
    var originalResponse = generateBaseResponse();
    delete originalResponse.headers;

    var response = new Response(originalResponse);
    response.headers.should.eql({});
    response.body.should.eql(originalResponse.body);
    response.status.should.eql(200);
  });

  it('should convert all header keys to lowercase', function() {
    var originalResponse = generateBaseResponse();
    originalResponse.headers = {
      Foo: 'bar',
      BAR: 'foo'
    };

    var response = new Response(originalResponse);
    response.headers.foo.should.eql('bar');
    response.headers.bar.should.eql('foo');
    should.not.exist(response.headers.Foo);
    should.not.exist(response.headers.BAR);
  });

  it('should include additional properties passed in the response', function() {
    var originalResponse = generateBaseResponse();
    originalResponse.custom = {
      newFoo: 'newBar'
    };

    originalResponse.custom2 = {
      newBar: 'newFoo'
    };

    var response = new Response(originalResponse);
    response.headers.should.eql(originalResponse.headers);
    response.body.should.eql(originalResponse.body);
    response.custom.should.eql(originalResponse.custom);
    response.custom2.should.eql(originalResponse.custom2);
  });

  it('should allow getting of headers using `response.get`', function() {
    var originalResponse = generateBaseResponse();

    var response = new Response(originalResponse);
    response.get('bar').should.eql(originalResponse.headers.bar);
  });

  it('should allow getting of headers using `response.get`', function() {
    var originalResponse = generateBaseResponse();

    var response = new Response(originalResponse);
    response.get('bar').should.eql(originalResponse.headers.bar);
  });

  it('should allow setting of headers using `response.set`', function() {
    var originalResponse = generateBaseResponse();

    var response = new Response(originalResponse);
    response.headers.should.eql(originalResponse.headers);
    response.set('newheader', 'newvalue');
    response.headers.bar.should.eql('foo');
    response.headers.newheader.should.eql('newvalue');
  });

 it('should process redirect', function() {
   var originalResponse = generateBaseResponse();

   var response = new Response(originalResponse);
   response.headers.should.eql(originalResponse.headers);
   response.status.should.eql(200);
   response.redirect('http://foo.bar');
   response.headers.location.should.eql('http://foo.bar');
   response.status.should.eql(302);
 });
});
