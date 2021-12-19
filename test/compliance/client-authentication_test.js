/**
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
 *
 *   For example (with extra line breaks for display purposes only):
 *
 *     Authorization: Basic czZCaGRSa3F0Mzo3RmpmcDBaQnIxS3REUmJuZlZkbUl3
 *
 *   Alternatively, the authorization server MAY support including the
 *   client credentials in the request-body using the following
 *   parameters:
 *
 *   client_id
 *         REQUIRED.  The client identifier issued to the client during
 *         the registration process described by Section 2.2.
 *
 *   client_secret
 *         REQUIRED.  The client secret.  The client MAY omit the
 *         parameter if the client secret is an empty string.
 */

const OAuth2Server = require('../..');
const DB = require('../helpers/db');
const createModel = require('../helpers/model');
const createRequest = require('../helpers/request');
const Response = require('../../lib/response');

require('chai').should();

const db = new DB();

const auth = new OAuth2Server({
  model: createModel(db)
});

const user = db.saveUser({ id: 1, username: 'test', password: 'test'});
const client = db.saveClient({ id: 'a', secret: 'b', grants: ['password'] });
const scope = 'read write';

function createDefaultRequest () {
  return createRequest({
    body: {
      grant_type: 'password',
      username: user.username,
      password: user.password,
      scope
    },
    headers: {
      'authorization': 'Basic ' + Buffer.from(client.id + ':' + client.secret).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
  });
}

describe('Client Authentication Compliance', function () {
  describe('No authentication', function () {
    it('should be an unsuccesfull authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.headers.authorization;

      await auth.token(request, response, {})
        .then((token) => {
          throw new Error('Should not be here');
        }).
        catch(err => {
          err.name.should.equal('invalid_client');
        });
    });
  });

  describe('Basic Authentication', function () {
    it('should be a succesfull authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      await auth.token(request, response, {});
    });

    it('should be an unsuccesfull authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      request.headers.authorization = 'Basic ' + Buffer.from('a:c').toString('base64');

      await auth.token(request, response, {})
        .then((token) => {
          throw new Error('Should not be here');
        }).
        catch(err => {
          err.name.should.equal('invalid_client');
        });
    });
  });

  describe('Request body authentication', function () {
    it('should be a succesfull authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.headers.authorization;

      request.body.client_id = client.id;
      request.body.client_secret = client.secret;

      await auth.token(request, response, {});
    });

    it('should be an unsuccesfull authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.headers.authorization;

      request.body.client_id = 'a';
      request.body.client_secret = 'c';

      await auth.token(request, response, {})
        .then((token) => {
          throw new Error('Should not be here');
        })
        .catch(err => {
          err.name.should.equal('invalid_client');
        });
    });
  });
});
