=========================
 UnauthorizedClientError
=========================

The authenticated client is not authorized to use this authorization grant type. See :rfc:`Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

::

  const UnauthorizedClientError = require('oauth2-server/lib/errors/unauthorized-client-error');

--------

.. _UnauthorizedClientError#constructor:

``new UnauthorizedClientError(message, properties)``
====================================================

Instantiates an ``UnauthorizedClientError``.

**Arguments:**

+-----------------------------------------+--------------+-------------------------------------------------------------+
| Name                                    | Type         | Description                                                 |
+=========================================+==============+=============================================================+
| [message=undefined]                     | String|Error | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                         | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=400]                   | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='unauthorized_client'] | String       | The error name used in responses generated from this error. |
+-----------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``UnauthorizedClientError``.

**Remarks:**

::

  const err = new UnauthorizedClientError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'unauthorized_client'

--------

.. _UnauthorizedClientError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _UnauthorizedClientError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _UnauthorizedClientError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _UnauthorizedClientError#name:

``name``
========

Typically ``'unauthorized_client'``. See :ref:`OAuthError#name <OAuthError#name>`.

