===================
 AccessDeniedError
===================

The resource owner or authorization server denied the request. See :rfc:`Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

::

  const AccessDeniedError = require('oauth2-server/lib/errors/access-denied-error');

--------

.. _AccessDeniedError#constructor:

``new AccessDeniedError(message, properties)``
==============================================

Instantiates an ``AccessDeniedError``.

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
| [properties.name='access_denied'] | String       | The error name used in responses generated from this error. |
+-----------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``AccessDeniedError``.

**Remarks:**

::

  const err = new AccessDeniedError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'access_denied'

--------

.. _AccessDeniedError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _AccessDeniedError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _AccessDeniedError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _AccessDeniedError#name:

``name``
========

Typically ``'access_denied'``. See :ref:`OAuthError#name <OAuthError#name>`.

