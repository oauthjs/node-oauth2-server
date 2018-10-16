==================
 Extension Grants
==================

.. todo:: Tidy up information on how to implement extension grants and use ``function``s instead of ``class``es

Create a subclass of AbstractGrantType, and implement ``handle`` and ``saveToken``, along with other required methods for the grant type.

.. code-block:: js

  class MyExtendedGrantType extends AbstractGrantType {
    constructor(options) {
      super(options)
    }
    
    async handle(request, client) {
      let user = this.getUser(request);
      let scope = this.getScope(request); //Superclass method
      
      return this.saveToken(user, client, scope);
    }
    
    async saveToken(user, client, scope) {
      this.validateScope(user, client, scope);
      return {
        accessToken: this.generateAccessToken(client, user, scope),
        accessTokenExpiresAt: this.getAccessTokenExpiresAt(),
        refreshToken: this.generateRefreshToken(client, user, scope),
        refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(),
        scope: scope
      }
    }
    
    async getUser(request) {
      // Get user's FB, Google, or etc. profile ID and check with own database, etc.
    }
  }

Extension grants are registered through :ref:`OAuth2Server#token() <OAuth2Server#token>` (``options.extendedGrantTypes``).
