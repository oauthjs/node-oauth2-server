=============
 ServerError
=============

The authorization server encountered an unexpected condition that prevented it from fulfilling the request. See :rfc:`Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

::

  const ServerError = require('oauth2-server/lib/errors/server-error');

``ServerError`` is used to wrap unknown exceptions encountered during request processing.

--------

.. _ServerError#constructor:

``new ServerError(message, properties)``
========================================

Instantiates an ``ServerError``.

**Arguments:**

+----------------------------------+--------------+-------------------------------------------------------------+
| Name                             | Type         | Description                                                 |
+==================================+==============+=============================================================+
| [message=undefined]              | String|Error | See :ref:`OAuthError#constructor`.                          |
+----------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                  | Object       | See :ref:`OAuthError#constructor`.                          |
+----------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=503]            | Object       | See :ref:`OAuthError#constructor`.                          |
+----------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='server_error'] | String       | The error name used in responses generated from this error. |
+----------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``ServerError``.

**Remarks:**

::

  const err = new ServerError();
  // err.message === 'Service Unavailable Error'
  // err.code === 503
  // err.name === 'server_error'

--------

.. _ServerError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _ServerError#code:

``code``
========

Typically ``503``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _ServerError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _ServerError#name:

``name``
========

Typically ``'server_error'``. See :ref:`OAuthError#name <OAuthError#name>`.

