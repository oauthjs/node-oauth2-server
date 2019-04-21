==========================
 UnauthorizedRequestError
==========================

The request lacked any authentication information or the client attempted to use an unsupported authentication method.

::

  const UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');

According to :rfc:`Section 3.1 of RFC 6750 <6750#section-3.1>` you should just fail the request with ``401 Unauthorized`` and not send any error information in the body if this error occurs:

  If the request lacks any authentication information (e.g., the client
  was unaware that authentication is necessary or attempted using an
  unsupported authentication method), the resource server SHOULD NOT
  include an error code or other error information.

--------

.. _UnauthorizedRequestError#constructor:

``new UnauthorizedRequestError(message, properties)``
=====================================================

Instantiates an ``UnauthorizedRequestError``.

**Arguments:**

+------------------------------------------+--------------+-------------------------------------------------------------+
| Name                                     | Type         | Description                                                 |
+==========================================+==============+=============================================================+
| [message=undefined]                      | String|Error | See :ref:`OAuthError#constructor`.                          |
+------------------------------------------+--------------+-------------------------------------------------------------+
| [properties={}]                          | Object       | See :ref:`OAuthError#constructor`.                          |
+------------------------------------------+--------------+-------------------------------------------------------------+
| [properties.code=401]                    | Object       | See :ref:`OAuthError#constructor`.                          |
+------------------------------------------+--------------+-------------------------------------------------------------+
| [properties.name='unauthorized_request'] | String       | The error name used in responses generated from this error. |
+------------------------------------------+--------------+-------------------------------------------------------------+

**Return value:**

A new instance of ``UnauthorizedRequestError``.

**Remarks:**

::

  const err = new UnauthorizedRequestError();
  // err.message === 'Unauthorized'
  // err.code === 401
  // err.name === 'unauthorized_request'

--------

.. _UnauthorizedRequestError#message:

``message``
===========

See :ref:`OAuthError#message <OAuthError#message>`.

--------

.. _UnauthorizedRequestError#code:

``code``
========

Typically ``401``. See :ref:`OAuthError#code <OAuthError#code>`.

--------

.. _UnauthorizedRequestError#inner:

``inner``
=========

See :ref:`OAuthError#inner <OAuthError#inner>`.

--------

.. _UnauthorizedRequestError#name:

``name``
========

Typically ``'unauthorized_request'``. See :ref:`OAuthError#name <OAuthError#name>`.

