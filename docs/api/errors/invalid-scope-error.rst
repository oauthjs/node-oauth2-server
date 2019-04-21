===================
 InvalidScopeError
===================

The requested scope is invalid, unknown, or malformed. See :rfc:`Section 4.1.2.1 of RFC 6749 <6749#section-4.1.2.1>`.

::

  const InvalidScopeError = require('oauth2-server/lib/errors/invalid-scope-error');

--------

.. _InvalidScopeError#constructor:

``new InvalidScopeError(message, properties)``
==============================================

Instantiates an ``InvalidScopeError``.

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
| [properties.name='invalid_scope'] | String       | The error name used in responses generated from this error. |
+-----------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``InvalidScopeError``.

**Remarks:**

::

  const err = new InvalidScopeError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'invalid_scope'

--------

.. _InvalidScopeError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _InvalidScopeError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _InvalidScopeError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _InvalidScopeError#name:

``name``
========

Typically ``'invalid_scope'``. See :ref:`OAuthError#name <OAuthError#name>`.

