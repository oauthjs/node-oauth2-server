===================
 InvalidTokenError
===================

The access token provided is expired, revoked, malformed, or invalid for other reasons. See :rfc:`Section 3.1 of RFC 6750 <6750#section-3.1>`.

::

  const InvalidTokenError = require('oauth2-server/lib/errors/invalid-token-error');

--------

.. _InvalidTokenError#constructor:

``new InvalidTokenError(message, properties)``
==============================================

Instantiates an ``InvalidTokenError``.

**Arguments:**

+-----------------------------------+--------------+-------------------------------------------------------------+
| Name                              | Type         | Description                                                 |
+===================================+==============+=============================================================+
| [message=undefined]               | String|Error | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                   | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=401]             | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='invalid_token'] | String       | The error name used in responses generated from this error. |
+-----------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``InvalidTokenError``.

**Remarks:**

::

  const err = new InvalidTokenError();
  // err.message === 'Unauthorized'
  // err.code === 401
  // err.name === 'invalid_token'

--------

.. _InvalidTokenError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _InvalidTokenError#code:

``code``
========

Typically ``401``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _InvalidTokenError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _InvalidTokenError#name:

``name``
========

Typically ``'invalid_token'``. See :ref:`OAuthError#name <OAuthError#name>`.

