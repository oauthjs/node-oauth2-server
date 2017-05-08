=====================
 InvalidRequestError
=====================

The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed. See :rfc:`Section 4.2.2.1 of RFC 6749 <6749#section-4.2.2.1>`.

::

  const InvalidRequestError = require('oauth2-server/lib/errors/invalid-request-error');

--------

.. _InvalidRequestError#constructor:

``new InvalidRequestError(message, properties)``
================================================

Instantiates an ``InvalidRequestError``.

**Arguments:**

+-------------------------------------+--------------+-------------------------------------------------------------+
| Name                                | Type         | Description                                                 |
+=====================================+==============+=============================================================+
| [message=undefined]                 | String|Error | See :ref:`OAuthError#constructor`.                          |
+-------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                     | Object       | See :ref:`OAuthError#constructor`.                          |
+-------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=400]               | Object       | See :ref:`OAuthError#constructor`.                          |
+-------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='invalid_request'] | String       | The error name used in responses generated from this error. |
+-------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``InvalidRequestError``.

**Remarks:**

::

  const err = new InvalidRequestError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'invalid_request'

--------

.. _InvalidRequestError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _InvalidRequestError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _InvalidRequestError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _InvalidRequestError#name:

``name``
========

Typically ``'invalid_request'``. See :ref:`OAuthError#name <OAuthError#name>`.

