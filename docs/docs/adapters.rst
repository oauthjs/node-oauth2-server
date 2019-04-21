==========
 Adapters
==========

The *oauth2-server* module is typically not used directly but through one of the available adapters, converting the interface to a suitable one for the HTTP server framework in use.

.. framework-agnostic but there are several officially supported adapters available for popular HTTP server frameworks such as Express_ and Koa_.

- express-oauth-server_ for Express_
- koa-oauth-server_ for Koa_

.. _express-oauth-server: https://npmjs.org/package/express-oauth-server
.. _Express: https://npmjs.org/package/express
.. _koa-oauth-server: https://npmjs.org/package/koa-oauth-server
.. _Koa: https://npmjs.org/package/koa


Writing Adapters
================

Adapters typically do the following:

- Inherit from :doc:`OAuth2Server </api/oauth2-server>`.

- Override :ref:`authenticate() <OAuth2Server#authenticate>`, :ref:`authorize() <OAuth2Server#authorize>` and :ref:`token() <OAuth2Server#token>`.

  Each of these functions should:

  - Create :doc:`Request </api/request>` and :doc:`Response </api/response>` objects from their framework-specific counterparts.

  - Call the original function.

  - Copy all fields from the :doc:`Response </api/response>` back to the framework-specific request object and send it.

Adapters should preserve functionality provided by *oauth2-server* but are free to add additional features that make sense for the respective HTTP server framework.

