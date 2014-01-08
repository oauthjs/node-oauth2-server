# In-Memory Example

## DO NOT USE THIS EXAMPLE IN PRODUCTION

The object exposed in model.js could be directly passed into the model paramater of the config
object when initiating.

For example:

```js
...

var express = require('express'),
    oauthserver = require('node-oauth2-server'),
    memorystore = require("./model");

var app = express();

app.configure(function() {
    var oauth = oauthserver({
        model: memorystore,
        grants: ['password','refresh_token'],
        debug: true
    });
    app.use(express.bodyParser()); // REQUIRED
    app.use(oauth.handler());
    app.use(oauth.errorHandler());
});

app.get('/', function (req, res) {
    // outputs datastores to the console
    memorystore.dump();

    // respond
    res.end('Secret area');
});

app.listen(3000);


...
```
