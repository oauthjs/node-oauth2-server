==============
 OAuth2Server
==============

Represents an OAuth2 server instance.

::

  const OAuth2Server = require('oauth2-server');

--------

.. _OAuth2Server#constructor:

``new OAuth2Server(options)``
=============================

Instantiates ``OAuth2Server`` using the supplied model.

**Arguments:**

+---------------+--------+---------------------------------+
| Name          | Type   | Description                     |
+===============+========+=================================+
| options       | Object | Server options.                 |
+---------------+--------+---------------------------------+
| options.model | Object | The :doc:`Model </model/spec>`. |
+---------------+--------+---------------------------------+

**Return value:**

A new ``OAuth2Server`` instance.

**Remarks:**

Any valid option for :ref:`OAuth2Server#authenticate() <OAuth2Server#authenticate>`, :ref:`OAuth2Server#authorize() <OAuth2Server#authorize>` and :ref:`OAuth2Server#token() <OAuth2Server#token>` can be passed to the constructor as well. The supplied options will be used as default for the other methods.

Basic usage:

::

  const oauth = new OAuth2Server({
    model: require('./model')
  });

Advanced example with additional options:

::

  const oauth = new OAuth2Server({
    model: require('./model'),
    allowBearerTokensInQueryString: true,
    accessTokenLifetime: 4 * 60 * 60
  });

--------

.. _OAuth2Server#authenticate:

``authenticate(request, response, [options], [callback])``
==========================================================

Authenticates a request.

**Arguments:**

+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| Name                                           | Type            | Description                                                           |
+================================================+=================+=======================================================================+
| request                                        | :doc:`request`  | Request object.                                                       |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| response                                       | :doc:`response` | Response object.                                                      |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| [options={}]                                   | Object          | Handler options.                                                      |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| [options.scope=undefined]                      | String          | The scope(s) to authenticate.                                         |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| [options.addAcceptedScopesHeader=true]         | Boolean         | Set the ``X-Accepted-OAuth-Scopes`` HTTP header on response objects.  |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| [options.addAuthorizedScopesHeader=true]       | Boolean         | Set the ``X-OAuth-Scopes`` HTTP header on response objects.           |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| [options.allowBearerTokensInQueryString=false] | Boolean         | Allow clients to pass bearer tokens in the query string of a request. |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+
| [callback=undefined]                           | Function        | Node-style callback to be used instead of the returned ``Promise``.   |
+------------------------------------------------+-----------------+-----------------------------------------------------------------------+

**Return value:**

A ``Promise`` that resolves to the access token object returned from :ref:`Model#getAccessToken() <Model#getAccessToken>`.
In case of an error, the promise rejects with one of the error types derived from :doc:`/api/errors/oauth-error`.

Possible errors include but are not limited to:

:doc:`/api/errors/unauthorized-request-error`:
  The protected resource request failed authentication.

The returned ``Promise`` **must** be ignored if ``callback`` is used.

**Remarks:**

::

  const oauth = new OAuth2Server({model: ...});

  function authenticateHandler(options) {
    return function(req, res, next) {
      let request = new Request(req);
      let response = new Response(res);
      return oauth.authenticate(request, response, options)
        .then(function(token) {
          res.locals.oauth = {token: token};
          next();
        })
        .catch(function(err) {
          // handle error condition
        });
    }
  }

--------

.. _OAuth2Server#authorize:

``authorize(request, response, [options], [callback])``
=======================================================

Authorizes a token request.

**Arguments:**

+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| Name                                    | Type            | Description                                                                 |
+=========================================+=================+=============================================================================+
| request                                 | :doc:`request`  | Request object.                                                             |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| [request.query.allowed=undefined]       | String          | ``'false'`` to deny the authorization request (see remarks section).        |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| response                                | :doc:`response` | Response object.                                                            |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| [options={}]                            | Object          | Handler options.                                                            |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| [options.authenticateHandler=undefined] | Object          | The authenticate handler (see remarks section).                             |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| [options.allowEmptyState=false]         | Boolean         | Allow clients to specify an empty ``state``.                                |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| [options.authorizationCodeLifetime=300] | Number          | Lifetime of generated authorization codes in seconds (default = 5 minutes). |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+
| [callback=undefined]                    | Function        | Node-style callback to be used instead of the returned ``Promise``.         |
+-----------------------------------------+-----------------+-----------------------------------------------------------------------------+

**Return value:**

A ``Promise`` that resolves to the authorization code object returned from :ref:`Model#saveAuthorizationCode() <Model#saveAuthorizationCode>`.
In case of an error, the promise rejects with one of the error types derived from :doc:`/api/errors/oauth-error`.

Possible errors include but are not limited to:

:doc:`/api/errors/access-denied-error`
  The resource owner denied the access request (i.e. ``request.query.allow`` was ``'false'``).

The returned ``Promise`` **must** be ignored if ``callback`` is used.

**Remarks:**

If ``request.query.allowed`` equals the string ``'false'`` the access request is denied and the returned promise is rejected with an :doc:`/api/errors/access-denied-error`.

In order to retrieve the user associated with the request, ``options.authenticateHandler`` should be supplied.
The ``authenticateHandler`` has to be an object implementing a ``handle(request, response)`` function that returns a user object.
If there is no associated user (i.e. the user is not logged in) a falsy value should be returned.

::

  let authenticateHandler = {
    handle: function(request, response) {
      return /* get authenticated user */;
    }
  };

When working with a session-based login mechanism, the handler can simply look like this:

::

  let authenticateHandler = {
    handle: function(request, response) {
      return request.session.user;
    }
  };

.. todo:: Move ``authenticateHandler`` to it's own section.

::

  const oauth = new OAuth2Server({model: ...});

  function authorizeHandler(options) {
    return function(req, res, next) {
      let request = new Request(req);
      let response = new Response(res);
      return oauth.authorize(request, response, options)
        .then(function(code) {
          res.locals.oauth = {code: code};
          next();
        })
        .catch(function(err) {
          // handle error condition
        });
    }
  }

--------

.. _OAuth2Server#token:

``token(request, response, [options], [callback])``
===================================================

Retrieves a new token for an authorized token request.

**Arguments:**

+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| Name                                         | Type            | Description                                                                               |
+==============================================+=================+===========================================================================================+
| request                                      | :doc:`request`  | Request object.                                                                           |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| response                                     | :doc:`response` | Response object.                                                                          |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [options={}]                                 | Object          | Handler options.                                                                          |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [options.accessTokenLifetime=3600]           | Number          | Lifetime of generated access tokens in seconds (default = 1 hour).                        |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [options.refreshTokenLifetime=1209600]       | Number          | Lifetime of generated refresh tokens in seconds (default = 2 weeks).                      |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [options.allowExtendedTokenAttributes=false] | Boolean         | Allow extended attributes to be set on the returned token (see remarks section).          |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [options.requireClientAuthentication={}]     | Object          | Require a client secret (see remarks section). Defaults to ``true`` for all grant types.  |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [options.alwaysIssueNewRefreshToken=true]    | Boolean         | Always revoke the used refresh token and issue a new one for the ``refresh_token`` grant. |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [options.extendedGrantTypes={}]              | Object          | Additional supported grant types.                                                         |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+
| [callback=undefined]                         | Function        | Node-style callback to be used instead of the returned ``Promise``.                       |
+----------------------------------------------+-----------------+-------------------------------------------------------------------------------------------+

**Return value:**

A ``Promise`` that resolves to the token object returned from :ref:`Model#saveToken() <Model#saveToken>`.
In case of an error, the promise rejects with one of the error types derived from :doc:`/api/errors/oauth-error`.

Possible errors include but are not limited to:

:doc:`/api/errors/invalid-grant-error`:
  The access token request was invalid or not authorized.

The returned ``Promise`` **must** be ignored if ``callback`` is used.

**Remarks:**

If ``options.allowExtendedTokenAttributes`` is ``true`` any additional properties set on the object returned from :ref:`Model#saveToken() <Model#saveToken>` are copied to the token response sent to the client.

By default all grant types require the client to send it's ``client_secret`` with the token request. ``options.requireClientAuthentication`` can be used to disable this check for selected grants. If used, this server option must be an object containing properties set to ``true`` or ``false``. Possible keys for the object include all supported values for the token request's ``grant_type`` field (``authorization_code``, ``client_credentials``, ``password`` and ``refresh_token``). Grants that are not specified default to ``true`` which enables verification of the ``client_secret``.

::

  let options = {
    // ...
    // Allow token requests using the password grant to not include a client_secret.
    requireClientAuthentication: {password: false}
  };

``options.extendedGrantTypes`` is an object mapping extension grant URIs to handler types, for example:

::

  let options = {
    // ...
    extendedGrantTypes: {
      'urn:foo:bar:baz': MyGrantType
    }
  };

For information on how to implement a handler for a custom grant type see :doc:`/misc/extension-grants`.

::

  const oauth = new OAuth2Server({model: ...});

  function tokenHandler(options) {
    return function(req, res, next) {
      let request = new Request(req);
      let response = new Response(res);
      return oauth.token(request, response, options)
        .then(function(code) {
          res.locals.oauth = {token: token};
          next();
        })
        .catch(function(err) {
          // handle error condition
        });
    }
  }

