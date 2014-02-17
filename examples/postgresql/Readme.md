# PostgreSQL Example

See schema.sql for the tables referred to in this example

The object exposed in model.js could be directly passed into the model parameter of the config
object when initiating.

For example:

```js
...

app.configure(function() {
  var oauth = oauthserver({
    model: require('./model'),
    grants: ['password'],
    debug: true
  });
  app.use(express.bodyParser());
  app.use(oauth.handler());
  app.use(oauth.errorHandler());
});

...
```
