import * as should from 'should';
import { Request } from '../../lib/request';

/**
 * Test `Request`.
 */

function generateBaseRequest() {
  return {
    query: {
      foo: 'bar',
    } as any,
    method: 'GET',
    headers: {
      bar: 'foo',
    } as any,
    body: {
      foobar: 'barfoo',
    } as any,
  } as any;
}

describe('Request', () => {
  it('should instantiate with a basic request', () => {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql(originalRequest.body);
  });

  it('should allow a request to be passed without a body', () => {
    const originalRequest = generateBaseRequest();
    delete originalRequest.body;

    const request = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql({});
  });

  it('should throw if headers are not passed to the constructor', () => {
    const originalRequest = generateBaseRequest();
    delete originalRequest.headers;

    (() => {
      new Request(originalRequest);
    }).should.throw('Missing parameter: `headers`');
  });

  it('should throw if query string isnt passed to the constructor', () => {
    const originalRequest = generateBaseRequest();
    delete originalRequest.query;

    (() => {
      new Request(originalRequest);
    }).should.throw('Missing parameter: `query`');
  });

  it('should throw if method isnt passed to the constructor', () => {
    const originalRequest = generateBaseRequest();
    delete originalRequest.method;

    (() => {
      new Request(originalRequest);
    }).should.throw('Missing parameter: `method`');
  });

  it('should convert all header keys to lowercase', () => {
    const originalRequest = generateBaseRequest();
    originalRequest.headers = {
      Foo: 'bar',
      BAR: 'foo',
    } as any;

    const request = new Request(originalRequest);
    request.headers.foo.should.eql('bar');
    request.headers.bar.should.eql('foo');
    should.not.exist(request.headers.Foo);
    should.not.exist(request.headers.BAR);
  });

  it('should include additional properties passed in the request', () => {
    const originalRequest = generateBaseRequest();
    originalRequest.custom = {
      newFoo: 'newBar',
    };

    originalRequest.custom2 = {
      newBar: 'newFoo',
    };

    const request: any = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql(originalRequest.body);
    request.custom.should.eql(originalRequest.custom);
    request.custom2.should.eql(originalRequest.custom2);
  });

  it('should include additional properties passed in the request', () => {
    const originalRequest = generateBaseRequest();
    originalRequest.custom = {
      newFoo: 'newBar',
    };

    originalRequest.custom2 = {
      newBar: 'newFoo',
    };

    const request: any = new Request(originalRequest);
    request.headers.should.eql(originalRequest.headers);
    request.method.should.eql(originalRequest.method);
    request.query.should.eql(originalRequest.query);
    request.body.should.eql(originalRequest.body);
    request.custom.should.eql(originalRequest.custom);
    request.custom2.should.eql(originalRequest.custom2);
  });

  it('should allow getting of headers using `request.get`', () => {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    request.get('bar').should.eql(originalRequest.headers.bar);
  });

  it('should allow getting of headers using `request.get`', () => {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    request.get('bar').should.eql(originalRequest.headers.bar);
  });

  it('should allow getting of headers using `request.get`', () => {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    request.get('bar').should.eql(originalRequest.headers.bar);
  });

  it('should validate the content-type', () => {
    const originalRequest = generateBaseRequest();
    originalRequest.headers['content-type'] =
      'application/x-www-form-urlencoded';
    originalRequest.headers['content-length'] = JSON.stringify(
      originalRequest.body,
    ).length;

    const request = new Request(originalRequest);
    request
      .is('application/x-www-form-urlencoded')
      .should.eql('application/x-www-form-urlencoded');
  });

  it('should return false if the content-type is invalid', () => {
    const originalRequest = generateBaseRequest();
    originalRequest.headers['content-type'] =
      'application/x-www-form-urlencoded';
    originalRequest.headers['content-length'] = JSON.stringify(
      originalRequest.body,
    ).length;

    const request = new Request(originalRequest);
    request.is('application/json').should.be.false();
  });
});
