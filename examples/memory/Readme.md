# In-Memory Example

## DO NOT USE THIS EXAMPLE IN PRODUCTION

The object exposed in model.js could be directly passed into the model parameter of the config object when initiating.

For example:

```js

var memorystore = require('model.js');

app.oauth = oauthserver({
  model: memorystore,
  grants: ['password','refresh_token'],
  debug: true
});

```

# Dump

You can also dump the contents of the memory store (for debugging) like so:

```js

memorystore.dump();

```
