================
 Model Overview
================

:doc:`/api/oauth2-server` requires a model object through which some aspects of storage, retrieval and custom validation are abstracted.

--------

.. _GrantTypes:

Grant Types
===========

:rfc:`6749` describes a number of grants for a client application to acquire an access token.

The following grant types are supported by *oauth2-server*:

--------

.. _AuthorizationCodeGrant:

Authorization Code Grant
------------------------

See :rfc:`Section 4.1 of RFC 6749 <6749#section-4.1>`.

An authorization code is a credential representing the resource owner's authorization (to access its protected resources) which is used by the client to obtain an access token.

Model functions used by the authorization code grant:

- :ref:`Model#generateAccessToken`
- :ref:`Model#generateRefreshToken`
- :ref:`Model#generateAuthorizationCode`
- :ref:`Model#getAuthorizationCode`
- :ref:`Model#getClient`
- :ref:`Model#saveToken`
- :ref:`Model#saveAuthorizationCode`
- :ref:`Model#revokeAuthorizationCode`
- :ref:`Model#validateScope`

--------

.. _ClientCredentialsGrant:

Client Credentials Grant
------------------------

See :rfc:`Section 4.4 of RFC 6749 <6749#section-4.4>`.

The client can request an access token using only its client credentials (or other supported means of authentication) when requesting access to the protected resources under its control.

.. note:: The client credentials grant type **must** only be used by confidential clients.

Model functions used by the client credentials grant:

- :ref:`Model#generateAccessToken`
- :ref:`Model#getClient`
- :ref:`Model#getUserFromClient`
- :ref:`Model#saveToken`
- :ref:`Model#validateScope`

--------

.. _RefreshTokenGrant:

Refresh Token Grant
-------------------

See :rfc:`Section 6 of RFC 6749 <6749#section-6>`.

If the authorization server issued a refresh token to the client, the client can request a refresh of their authorization token.

Model functions used by the refresh token grant:

- :ref:`Model#generateRefreshToken`
- :ref:`Model#getRefreshToken`
- :ref:`Model#getClient`
- :ref:`Model#saveToken`
- :ref:`Model#revokeToken`

--------

.. _PasswordGrant:

Password Grant
--------------

See :rfc:`Section 4.3 of RFC 6749 <6749#section-4.3>`.

The password grant is suitable for clients capable of obtaining the resource owner's credentials (username and password, typically using an interactive form).

Model functions used by the password grant:

- :ref:`Model#generateAccessToken`
- :ref:`Model#generateRefreshToken`
- :ref:`Model#getClient`
- :ref:`Model#getUser`
- :ref:`Model#saveToken`
- :ref:`Model#validateScope`

--------

.. _ExtensionGrants:

Extension Grants
----------------

See :rfc:`Section 4.5 of RFC 6749 <6749#section-4.5>`.

The authorization server may also implement custom grant types to issue access (and optionally refresh) tokens.

See :doc:`/misc/extension-grants`.

--------

.. _RequestAuthentication:

Request Authentication
======================

See :rfc:`Section 2 of RFC 6750 <6750#section-2>`.

The authorization server authenticates requests sent to the resource server by verifying the included bearer token.

Model functions used during request authentication:

- :ref:`Model#getAccessToken`
- :ref:`Model#verifyScope`

