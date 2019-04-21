============
 OAuthError
============

Base class for all errors returned by this module.

::

  const OAuthError = require('oauth2-server/lib/errors/oauth-error');

--------

.. _OAuthError#constructor:

``new OAuthError(message, properties)``
=======================================

Instantiates ``OAuthError``.

.. note:: Do not use ``OAuthError`` directly; it's intended to be used as a base class. Instead, use one of the other error types derived from it.

**Arguments:**

+-----------------------------+--------------+------------------------------------------------------------------------------------+
| Name                        | Type         | Description                                                                        |
+=============================+==============+====================================================================================+
| [message=undefined]         | String|Error | Error message or nested exception.                                                 |
+-----------------------------+--------------+------------------------------------------------------------------------------------+
| [properties={}]             | Object       | Additional properties to be set on the error object.                               |
+-----------------------------+--------------+------------------------------------------------------------------------------------+
| [properties.code=500]       | Object       | An HTTP status code associated with the error.                                     |
+-----------------------------+--------------+------------------------------------------------------------------------------------+
| [properties.name=undefined] | String       | The name of the error. If left undefined, the name is copied from the constructor. |
+-----------------------------+--------------+------------------------------------------------------------------------------------+

**Return value:**

A new instance of ``OAuthError``.

**Remarks:**

By default ``code`` is set to ``500`` and ``message`` is set to the respective HTTP phrase.

::

  const err = new OAuthError();
  // err.message === 'Internal Server Error'
  // err.code === 500
  // err.name === 'OAuthError'

::

  const err = new OAuthError('test', {name: 'test_error'});
  // err.message === 'test'
  // err.code === 500
  // err.name === 'test_error'

::

  const err = new OAuthError(undefined, {code: 404});
  // err.message === 'Not Found'
  // err.code === 404
  // err.name === 'OAuthError'

All additional ``properties`` are copied to the error object.

::

  const err = new OAuthError('test', {foo: 'bar', baz: 1234});
  // err.message === 'test'
  // err.code === 500
  // err.name === 'OAuthError'
  // err.foo === 'bar'
  // err.baz === 1234

When wrapping an exception, the ``message`` property is automatically copied from the existing exception.

::

  const anotherError = new Error('test');
  const err = new OAuthError(e);
  // err.message === 'test'
  // err.code === 500
  // err.name === 'OAuthError'
  // err.inner === anotherError

--------

.. _OAuthError#message:

``message``
===========

A message describing the error.

--------

.. _OAuthError#code:

``code``
========

An HTTP status code associated with the error.

For compatibility reasons, two more properties exist that have the same value as ``code``: ``status`` and ``statusCode``. Note that changes to one of these are not reflected by the other properties.

--------

.. _OAuthError#inner:

``inner``
=========

Another exception that was wrapped by this ``OAuthError`` instance. This property is set only if the error is constructed from an existing exception.

--------

.. _OAuthError#name:

``name``
========

The name of the error, intended to be used as the ``error`` parameter as described by :rfc:`6749` in :rfc:`Section 4.1.2.1 <6749#section-4.1.2.1>`, :rfc:`Section 4.2.2.1 <6749#section-4.2.2.1>` and :rfc:`Section 5.2 <6749#section-5.2>`, as well as :rfc:`Section 3.1 of RFC 6750 <6750#section-3.1>`.

