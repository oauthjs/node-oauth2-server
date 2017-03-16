========================
 InsufficientScopeError
========================

The request requires higher privileges than provided by the access token. See :rfc:`Section 3.1 of RFC 6750 <6750#section-3.1>`.

::

  const InsufficientScopeError = require('oauth2-server/lib/errors/insufficient-scope-error');

--------

.. _InsufficientScopeError#constructor:

``new InsufficientScopeError(message, properties)``
===================================================

Instantiates an ``InsufficientScopeError``.

**Arguments:**

+----------------------------------------+--------------+-------------------------------------------------------------+
| Name                                   | Type         | Description                                                 |
+========================================+==============+=============================================================+
| [message=undefined]                    | String|Error | See :ref:`OAuthError#constructor`.                          |
+----------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                        | Object       | See :ref:`OAuthError#constructor`.                          |
+----------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=403]                  | Object       | See :ref:`OAuthError#constructor`.                          |
+----------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='insufficient_scope'] | String       | The error name used in responses generated from this error. |
+----------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``InsufficientScopeError``.

**Remarks:**

::

  const err = new InsufficientScopeError();
  // err.message === 'Forbidden'
  // err.code === 403
  // err.name === 'insufficient_scope'

--------

.. _InsufficientScopeError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _InsufficientScopeError#code:

``code``
========

Typically ``403``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _InsufficientScopeError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _InsufficientScopeError#name:

``name``
========

Typically ``'insufficient_scope'``. See :ref:`OAuthError#name <OAuthError#name>`.

