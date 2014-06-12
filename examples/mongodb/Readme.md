# MongoDB Example

You will need to initialize a Mongoose connection to a mongo db beforehand.

For example :

```js

var mongoose = require('mongoose');

var uristring = 'mongodb://localhost/test';

// Makes connection asynchronously. Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});

```

The object exposed in model.js could be directly passed into the model parameter of the config object when initiating.

For example:

```js

app.oauth = oauthserver({
  model: require('./model'),
  grants: ['password'],
  debug: true
});

```