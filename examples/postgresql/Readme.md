# PostgreSQL Example

See schema.sql for the tables referred to in this example

The object exposed in model.js could be directly passed into the model parameter of the config object when initiating.

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

## Note

Postgres connection info is read from the `DATABASE_URL` environment variable which you can set when you run, for example:

```
$ DATABASE_URL=postgres://postgres:1234@localhost/postgres node index.js
```