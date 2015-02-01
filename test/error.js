var should = require('should');

var OAuth2Error = require('../lib/error');

describe('OAuth2Error', function() {

  it('should be an instance of `Error`', function () {
    var error = new OAuth2Error('invalid_request', 'The access token was not found');

    error.should.be.instanceOf(Error);
  });

  it('should expose the `message` as the description', function () {
    var error = new OAuth2Error('invalid_request', 'The access token was not found');

    error.message.should.equal('The access token was not found');
  });

  it('should expose the `stack`', function () {
    var error = new OAuth2Error('invalid_request', 'The access token was not found');

    error.stack.should.not.equal(undefined);
  });

  it('should expose a custom `name`', function () {
    var error = new OAuth2Error();

    error.name.should.equal('OAuth2Error');
  });

  it('should set cache `headers`', function () {
    var error = new OAuth2Error('invalid_request');

    error.headers.should.eql({
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    });
  });

  it('should include WWW-Authenticate `header` if error is `invalid_client`', function () {
    var error = new OAuth2Error('invalid_client');

    error.headers.should.eql({
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'WWW-Authenticate': 'Basic realm="Service"'
    });
  });

  it('should expose a status `code`', function () {
    var error = new OAuth2Error('invalid_client');

    error.code.should.be.instanceOf(Number);
  });

  it('should expose the `error`', function () {
    var error = new OAuth2Error('invalid_client');

    error.error.should.equal('invalid_client');
  });

  it('should expose the `error_description`', function () {
    var error = new OAuth2Error('invalid_client', 'The access token was not found');

    error.error_description.should.equal('The access token was not found');
  });

  it('should expose the `stack` of a previous error', function () {
    var error = new OAuth2Error('invalid_request', 'The access token was not found', new Error());

    error.stack.should.not.match(/^OAuth2Error/);
    error.stack.should.match(/^Error/);
  });

  it('should expose the `message` of a previous error', function () {
    var error = new OAuth2Error('invalid_request', 'The access token was not found', new Error('foo'));

    error.message.should.equal('foo');
  });

});
