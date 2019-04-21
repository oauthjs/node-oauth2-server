========
 Errors
========

Noteable error types:

``OAuthError``
  :doc:`oauth-error` is the base class for all exceptions thrown/returned by *oauth2-server*.

``ServerError``
  :doc:`server-error` is used to wrap unknown exceptions encountered during request processing.

``InvalidArgumentError``
  :doc:`invalid-argument-error` is thrown when an invalid argument is encountered. This error indicates that the module is used incorrectly and should never be seen because of external errors.


.. toctree::
   :maxdepth: 1
   :caption: Errors
   :hidden:

   oauth-error
   server-error
   invalid-argument-error
   access-denied-error
   insufficient-scope-error
   invalid-client-error
   invalid-grant-error
   invalid-request-error
   invalid-scope-error
   invalid-token-error
   unauthorized-client-error
   unauthorized-request-error
   unsupported-grant-type-error
   unsupported-response-type-error

