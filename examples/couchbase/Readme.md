# Couchbase Example

# Installation

Go to [couchbase downloads](http://www.couchbase.com/nosql-databases/downloads) and install the couchbase server

```sh

npm install couchbase

```

# Testing

Update testData.js Administrator username and password for couchbase server.

```sh

npm install async
node testData.js
mocha

```

The object exposed in model.js could be directly passed into the model parameter of the config object when initiating.

For example:

```js

var couchbaseModel = require('model.js');

app.oauth = oauthserver({
  model: couchbaseModel,
  grants: ['password','refresh_token'],
  debug: true
});

```

# Dump

You can also dump the contents of the db store (for debugging) like so:

```js

couchbaseModel.dump();

```

