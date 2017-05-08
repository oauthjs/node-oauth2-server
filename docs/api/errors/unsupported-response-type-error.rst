==============================
 UnsupportedResponseTypeError
==============================

The authorization server does not supported obtaining an authorization code using this method. See :rfc:`Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

::

  const UnsupportedResponseTypeError = require('oauth2-server/lib/errors/unsupported-response-type-error');

--------

.. _UnsupportedResponseTypeError#constructor:

``new UnsupportedResponseTypeError(message, properties)``
=========================================================

Instantiates an ``UnsupportedResponseTypeError``.

**Arguments:**

+-----------------------------------------------+--------------+-------------------------------------------------------------+
| Name                                          | Type         | Description                                                 |
+===============================================+==============+=============================================================+
| [message=undefined]                           | String|Error | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                               | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=400]                         | Object       | See :ref:`OAuthError#constructor`.                          |
+-----------------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='unsupported_response_type'] | String       | The error name used in responses generated from this error. |
+-----------------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``UnsupportedResponseTypeError``.

**Remarks:**

::

  const err = new UnsupportedResponseTypeError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'unsupported_response_type'

--------

.. _UnsupportedResponseTypeError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _UnsupportedResponseTypeError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _UnsupportedResponseTypeError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _UnsupportedResponseTypeError#name:

``name``
========

Typically ``'unsupported_response_type'``. See :ref:`OAuthError#name <OAuthError#name>`.

