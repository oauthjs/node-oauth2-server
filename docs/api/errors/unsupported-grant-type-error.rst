===========================
 UnsupportedGrantTypeError
===========================

The authorization grant type is not supported by the authorization server. See :rfc:`Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

::

  const UnsupportedGrantTypeError = require('oauth2-server/lib/errors/unsupported-grant-type-error');

--------

.. _UnsupportedGrantTypeError#constructor:

``new UnsupportedGrantTypeError(message, properties)``
======================================================

Instantiates an ``UnsupportedGrantTypeError``.

**Arguments:**

+--------------------------------------------+--------------+-------------------------------------------------------------+
| Name                                       | Type         | Description                                                 |
+============================================+==============+=============================================================+
| [message=undefined]                        | String|Error | See :ref:`OAuthError#constructor`.                          |
+--------------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                            | Object       | See :ref:`OAuthError#constructor`.                          |
+--------------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=400]                      | Object       | See :ref:`OAuthError#constructor`.                          |
+--------------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='unsupported_grant_type'] | String       | The error name used in responses generated from this error. |
+--------------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``UnsupportedGrantTypeError``.

**Remarks:**

::

  const err = new UnsupportedGrantTypeError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'unsupported_grant_type'

--------

.. _UnsupportedGrantTypeError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _UnsupportedGrantTypeError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _UnsupportedGrantTypeError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _UnsupportedGrantTypeError#name:

``name``
========

Typically ``'unsupported_grant_type'``. See :ref:`OAuthError#name <OAuthError#name>`.

