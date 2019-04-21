======================
 InvalidArgumentError
======================

An invalid argument was encountered.

::

  const InvalidArgumentError = require('oauth2-server/lib/errors/invalid-argument-error');

.. note:: This error indicates that the module is used incorrectly (i.e., there is a programming error) and should never be seen because of external errors (like invalid data sent by a client).

--------

.. _InvalidArgumentError#constructor:

``new InvalidArgumentError(message, properties)``
=================================================

Instantiates an ``InvalidArgumentError``.

**Arguments:**

+--------------------------------------+--------------+-------------------------------------------------------------+
| Name                                 | Type         | Description                                                 |
+======================================+==============+=============================================================+
| [message=undefined]                  | String|Error | See :ref:`OAuthError#constructor`.                          |
+--------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                      | Object       | See :ref:`OAuthError#constructor`.                          |
+--------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=500]                | Object       | See :ref:`OAuthError#constructor`.                          |
+--------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='invalid_argument'] | String       | The error name used in responses generated from this error. |
+--------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``InvalidArgumentError``.

**Remarks:**

::

  const err = new InvalidArgumentError();
  // err.message === 'Internal Server Error'
  // err.code === 500
  // err.name === 'invalid_argument'

--------

.. _InvalidArgumentError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _InvalidArgumentError#code:

``code``
========

Typically ``500``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _InvalidArgumentError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _InvalidArgumentError#name:

``name``
========

Typically ``'invalid_argument'``. See :ref:`OAuthError#name <OAuthError#name>`.

