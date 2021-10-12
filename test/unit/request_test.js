'use strict';

/**
 * Module dependencies.
 */

var Request = require('../../lib/request');
var should = require('chai').should();

/**
 * Test `Request`.
 */

function generateBaseRequest() {
  return {
    query: {
      foo: 'bar'
    },
    method: 'GET',
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
    var originalRequest = generateBaseRequest();

    var request = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql(originalRequest.body);
  });

  it('should allow a request to be passed without a body', function() {
    var originalRequest = generateBaseRequest();
    delete originalRequest.body;

    var request = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql({});
  });

  it('should throw if headers are not passed to the constructor', function() {
    var originalRequest = generateBaseRequest();
    delete originalRequest.headers;

    (function() {
      new Request(originalRequest);
    }).should.throw('Missing parameter: `headers`');
  });

  it('should throw if query string isn\'t passed to the constructor', function() {
    var originalRequest = generateBaseRequest();
    delete originalRequest.query;

    (function() {
      new Request(originalRequest);
    }).should.throw('Missing parameter: `query`');
  });

  it('should throw if method isn\'t passed to the constructor', function() {
    var originalRequest = generateBaseRequest();
    delete originalRequest.method;

    (function() {
      new Request(originalRequest);
    }).should.throw('Missing parameter: `method`');
  });

  it('should convert all header keys to lowercase', function() {
    var originalRequest = generateBaseRequest();
    originalRequest.headers = {
      Foo: 'bar',
      BAR: 'foo'
    };

    var request = new Request(originalRequest);
    request.headers.foo.should.eql('bar');
    request.headers.bar.should.eql('foo');
    should.not.exist(request.headers.Foo);
    should.not.exist(request.headers.BAR);
  });

  it('should include additional properties passed in the request', function() {
    var originalRequest = generateBaseRequest();
    originalRequest.custom = {
      newFoo: 'newBar'
    };

    originalRequest.custom2 = {
      newBar: 'newFoo'
    };

    var request = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql(originalRequest.body);
    request.custom.should.eql(originalRequest.custom);
    request.custom2.should.eql(originalRequest.custom2);
  });

  it('should include additional properties passed in the request', function() {
    var originalRequest = generateBaseRequest();
    originalRequest.custom = {
      newFoo: 'newBar'
    };

    originalRequest.custom2 = {
      newBar: 'newFoo'
    };

    var request = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql(originalRequest.body);
    request.custom.should.eql(originalRequest.custom);
    request.custom2.should.eql(originalRequest.custom2);
  });

  it('should allow getting of headers using `request.get`', function() {
    var originalRequest = generateBaseRequest();

    var request = new Request(originalRequest);
    request.get('bar').should.eql(originalRequest.headers.bar);
  });

  it('should allow getting of headers using `request.get`', function() {
    var originalRequest = generateBaseRequest();

    var request = new Request(originalRequest);
    request.get('bar').should.eql(originalRequest.headers.bar);
  });

  it('should allow getting of headers using `request.get`', function() {
    var originalRequest = generateBaseRequest();

    var request = new Request(originalRequest);
    request.get('bar').should.eql(originalRequest.headers.bar);
  });

  it('should validate the content-type', function() {
    var originalRequest = generateBaseRequest();
    originalRequest.headers['content-type'] = 'application/x-www-form-urlencoded';
    originalRequest.headers['content-length'] = JSON.stringify(originalRequest.body).length;

    var request = new Request(originalRequest);
    request.is('application/x-www-form-urlencoded').should.eql('application/x-www-form-urlencoded');
  });

  it('should return false if the content-type is invalid', function() {
    var originalRequest = generateBaseRequest();
    originalRequest.headers['content-type'] = 'application/x-www-form-urlencoded';
    originalRequest.headers['content-length'] = JSON.stringify(originalRequest.body).length;

    var request = new Request(originalRequest);
    request.is('application/json').should.eql(false);
  });
});
