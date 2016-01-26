# Couchbase example

## Requires
[Couchbase](https://www.npmjs.com/package/couchbase)

## Usage

1. Edit `config.json` and put on your couchbase server values, and choose your client id/secret and token lifetime values.

2. Install design documents that have the views needed for OAuth token management:

	node app.js --setup
	
3. Run the app

	node app.js