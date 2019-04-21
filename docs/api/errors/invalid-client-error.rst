====================
 InvalidClientError
====================

Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method). See :rfc:`Section 5.2 of RFC 6749 <6749#section-5.2>`.

::

  const InvalidClientError = require('oauth2-server/lib/errors/invalid-client-error');

--------

.. _InvalidClientError#constructor:

``new InvalidClientError(message, properties)``
===============================================

Instantiates an ``InvalidClientError``.

**Arguments:**

+------------------------------------+--------------+-------------------------------------------------------------+
| Name                               | Type         | Description                                                 |
+====================================+==============+=============================================================+
| [message=undefined]                | String|Error | See :ref:`OAuthError#constructor`.                          |
+------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                    | Object       | See :ref:`OAuthError#constructor`.                          |
+------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=400]              | Object       | See :ref:`OAuthError#constructor`.                          |
+------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='invalid_client'] | String       | The error name used in responses generated from this error. |
+------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``InvalidClientError``.

**Remarks:**

::

  const err = new InvalidClientError();
  // err.message === 'Bad Request'
  // err.code === 400
  // err.name === 'invalid_client'

--------

.. _InvalidClientError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _InvalidClientError#code:

``code``
========

Typically ``400``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _InvalidClientError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _InvalidClientError#name:

``name``
========

Typically ``'invalid_client'``. See :ref:`OAuthError#name <OAuthError#name>`.

