=========
 Request
=========

Represents an incoming HTTP request.

::

  const Request = require('oauth2-server').Request;

--------

.. _Request#constructor:

``new Request(options)``
========================

Instantiates ``Request`` using the supplied options.

**Arguments:**

+-------------------+--------+--------------------------------------------------------+
| Name              | Type   | Description                                            |
+===================+========+========================================================+
| options           | Object | Request options.                                       |
+-------------------+--------+--------------------------------------------------------+
| options.method    | String | The HTTP method of the request.                        |
+-------------------+--------+--------------------------------------------------------+
| options.query     | Object | The request's query string parameters.                 |
+-------------------+--------+--------------------------------------------------------+
| options.headers   | Object | The request's HTTP header fields.                      |
+-------------------+--------+--------------------------------------------------------+
| [options.body={}] | Object | Key-value pairs of data submitted in the request body. |
+-------------------+--------+--------------------------------------------------------+

All additional own properties are copied to the new ``Request`` object as well.

**Return value:**

A new ``Request`` instance.

**Remarks:**

The names of HTTP header fields passed in as ``options.headers`` are converted to lower case.

To convert `Express' request`_ to a ``Request`` simply pass ``req`` as ``options``:

.. _Express' request: https://expressjs.com/en/4x/api.html#req

::

  function(req, res, next) {
    var request = new Request(req);
    // ...
  }

--------

.. _Request#get:

``get(field)``
==============

Returns the specified HTTP header field. The match is case-insensitive.

**Arguments:**

+-------+--------+------------------------+
| Name  | Type   | Description            |
+=======+========+========================+
| field | String | The header field name. |
+-------+--------+------------------------+

**Return value:**

The value of the header field or ``undefined`` if the field does not exist.

--------

.. _Request#is:

``is(types)``
=============

Checks if the request's ``Content-Type`` HTTP header matches any of the given MIME types.

**Arguments:**

+-------+----------------------+-----------------------------------+
| Name  | Type                 | Description                       |
+=======+======================+===================================+
| types | Array<String>|String | The MIME type(s) to test against. |
+-------+----------------------+-----------------------------------+

**Return value:**

Returns the matching MIME type or ``false`` if there was no match.

--------

.. _Request#method:

``method``
==========

The HTTP method of the request (``'GET'``, ``'POST'``, ``'PUT'``, ...).

--------

.. _Request#query:

``query``
=========

The request's query string parameters.

--------

.. _Request#headers:

``headers``
===========

The request's HTTP header fields. Prefer :ref:`Request#get() <Request#get>` over accessing this object directly.

--------

.. _Request#body:

``body``
========

Key-value pairs of data submitted in the request body.

