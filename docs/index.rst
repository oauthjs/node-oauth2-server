===============
 oauth2-server
===============

oauth2-server_ is a complete, compliant and well tested module for implementing an OAuth2 server in Node.js_. The project is `hosted on GitHub`_ and the included test suite is automatically `run on Travis CI`_.

.. _oauth2-server: https://npmjs.org/package/oauth2-server
.. _Node.js: https://nodejs.org
.. _hosted on GitHub: https://github.com/oauthjs/node-oauth2-server
.. _run on Travis CI: https://travis-ci.org/oauthjs/node-oauth2-server

:ref:`installation`


Example Usage
=============

::

  const OAuth2Server = require('oauth2-server');
  const Request = OAuth2Server.Request;
  const Response = OAuth2Server.Response;

  const oauth = new OAuth2Server({
    model: require('./model')
  });

  let request = new Request({
    method: 'GET',
    query: {},
    headers: {Authorization: 'Bearer foobar'}
  });

  let response = new Response({
    headers: {}
  });

  oauth.authenticate(request, response)
    .then((token) => {
      // The request was successfully authenticated.
    })
    .catch((err) => {
      // The request failed authentication.
    });

See the :doc:`/model/spec` of what is required from the model passed to :doc:`/api/oauth2-server`.


.. toctree::
   :hidden:

   Home <self>

.. toctree::
   :maxdepth: 2
   :caption: User Documentation
   :hidden:

   docs/getting-started
   docs/adapters

.. toctree::
   :maxdepth: 2
   :caption: API
   :includehidden:
   :hidden:

   api/oauth2-server
   api/request
   api/response
   api/errors/index

.. toctree::
   :maxdepth: 3
   :caption: Model
   :hidden:

   model/overview
   model/spec

.. toctree::
   :maxdepth: 2
   :caption: Miscellaneous
   :hidden:

   misc/extension-grants
   misc/migrating-v2-to-v3

