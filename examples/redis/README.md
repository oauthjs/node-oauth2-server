# Redis Example

A simple example with support for `password` and `refresh_token` grants using [Redis](http://redis.io/). You'll need [node-redis](https://github.com/mranney/node_redis) installed.

## Usage

```js
app.oauth = oauthserver({
  model: require('./model'),
  grants: ['password', 'refresh_token'],
  debug: true
});
```

## Data model

The example makes use of a simple data model where clients, tokens, refresh tokens and users are stored as [hashes](http://redis.io/topics/data-types#hashes). The allowed grants for each client are stored in a [set](http://redis.io/topics/data-types#sets) `clients:{id}:grant_types`. This allows grants to be added or removed dynamically. To simplify the user lookup users are identified by their username and not by a separate ID. Passwords are stored in the clear for simplicity, but in practice these should be hashed using a library like [bcrypt](https://github.com/ncb000gt/node.bcrypt.js).

To inject some test data you can run the `testData.js` script in this directory. This will create a client with the ID `client` and secret `secret` and create a single user with the username `username` and password `password`.