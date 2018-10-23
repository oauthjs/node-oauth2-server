==================
 Extension Grants
==================

.. todo:: Use functions instead of ES6 class

Create a subclass of ``AbstractGrantType`` and create methods `handle` and `saveToken` along with other required methods according to needs

.. code-block:: js

  const OAuth2Server = require('oauth2-server');
  const AbstractGrantType = OAuth2Server.AbstractGrantType;
  const InvalidArgumentError = OAuth2Server.InvalidArgumentError;
  const InvalidRequestError = OAuth2Server.InvalidRequestError;

  class MyCustomGrantType extends AbstractGrantType {
      constructor(opts) {
          super(opts);
      }

      async handle(request, client) {
          if (!request) throw new InvalidArgumentError('Missing `request`');
          if (!client) throw new InvalidArgumentError('Missing `client`');

          let scope = this.getScope(request);
          let user = await this.getUserBySomething(request);

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
          };

          return this.model.saveToken(token, client, user);
      }

      async getUserBySomething(request) {
          //Get user's data by corresponding data (FB User ID, Google, etc.), etc.
      }
  }

  module.exports = MyCustomGrantType;

Extension grants are registered through :ref:`OAuth2Server#token() <OAuth2Server#token>` (``options.extendedGrantTypes``).

This might require you to approve the new ``grant_type`` for a particular ``client`` if you do checks on valid grant types.
