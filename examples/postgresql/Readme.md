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


## Load Schema

To load the schema 

```bash 
$ brew install postgres
$ postgres -D /usr/local/var/postgres
$ createuser -P -s -e admin # http://www.postgresql.org/docs/9.3/static/app-createuser.html
$ createdb myoauthdbname # http://www.postgresql.org/docs/9.3/static/manage-ag-createdb.html
$ psql myoauthdbname < schema.sql 
```

## Start Service

```bash
$ DATABASE_URL=postgres://admin:none@localhost/myoauthdbname  node index.js  # postgres://YOURUSER:YOURPASSWORD@YOURHOST/YOURDBNAME 
```
