==================
 Extension Grants
==================

.. todo:: Use functions instead of ES6 class

Create a subclass of ``AbstractGrantType`` and create methods `handle` and `saveToken` along with other required methods according to needs

.. code-block:: js

  let AbstractGrantType = require('oauth2-server/lib/grant-types/abstract-grant-type');
  let InvalidArgumentError = require('oauth2-server/lib/errors/invalid-argument-error');
  let InvalidRequestError = require('oauth2-server/lib/errors/invalid-request-error');

  class MyCustomGrantType extends AbstractGrantType {
      constructor(opts) {
          super(opts);
      }

      async handle(request, client) {
          if (!request) throw new InvalidArgumentError('Missing `request`');
          if (!client) throw new InvalidArgumentError('Missing `client`');

          let scope = this.getScope(request);
          let user = await this.getUser(request);

          return this.saveToken(user, client, scope);
      }

      async saveToken(user, client, scope) {
          this.validateScope(user, client, scope);

          let token = {
              accessToken: await this.generateAccessToken(client, user, scope),
              accessTokenExpiresAt: this.getAccessTokenExpiresAt(),
              refreshToken: await this.generateRefreshToken(client, user, scope),
              refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(),
              scope: scope
          }

          return this.model.saveToken(token, client, user);
      }

      async getUserBySomething(request) {
          //Get user's data by corresponding data (FB User ID, Google, etc.), etc.
      }
  }

  module.exports = MyCustomGrantType;

Extension grants are registered through `OAuth2Server#token() <https://oauth2-server.readthedocs.io/en/latest/api/oauth2-server.html#token-request-response-options-callback>`_ (``options.extendedGrantTypes``).

This might require you to add the new ``grant_type`` into the ``client`` data
