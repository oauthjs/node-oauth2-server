===================
 InvalidGrantError
===================

The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client. See :rfc:`Section 5.2 of RFC 6749 <6749#section-5.2>`.

::

  const InvalidGrantError = require('oauth2-server/lib/errors/invalid-grant-error');

--------

.. _InvalidGrantError#constructor:

``new InvalidGrantError(message, properties)``
==============================================

Instantiates an ``InvalidGrantError``.

**Arguments:**

+-----------------------------------+--------------+-------------------------------------------------------------+
| Name                              | Type         | Description                                                 |
+===================================+==============+=============================================================+
| [message=undefined]               | String|Error | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                   | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=400]             | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='invalid_grant'] | String       | The error name used in responses generated from this error. |
+-----------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``InvalidGrantError``.

**Remarks:**

::

  const err = new InvalidGrantError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'invalid_grant'

--------

.. _InvalidGrantError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _InvalidGrantError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _InvalidGrantError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _InvalidGrantError#name:

``name``
========

Typically ``'invalid_grant'``. See :ref:`OAuthError#name <OAuthError#name>`.

