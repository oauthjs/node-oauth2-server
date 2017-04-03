# DynamoDB Example

requires  
http://aws.amazon.com/sdkfornodejs/  

- - -

You will need to create the required tables (see below):

The object exposed in model.js could be directly passed into the model paramater of the config
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


####Creating required tables in DynamoDB

```js
//
// Table definitions
//
var OAuth2AccessToken =
{
    AttributeDefinitions: [
        {
            AttributeName: "access_token",
            AttributeType: "S"
        }
    ],
    TableName: "oauth2accesstoken",
    KeySchema: [
        {
            AttributeName: "access_token",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 12,
        WriteCapacityUnits: 6
    }
};

var OAuth2Client =
{
    AttributeDefinitions: [
        {
            AttributeName: "client_id",
            AttributeType: "S"
        },
        {
            AttributeName: "client_secret",
            AttributeType: "S"
        }
    ],
    TableName: "oauth2client",
    KeySchema: [
        {
            AttributeName: "client_id",
            KeyType: "HASH"
        },
        {
            AttributeName: "client_secret",
            KeyType: "RANGE"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 6,
        WriteCapacityUnits: 6
    }
};


var OAuth2User =
{
    AttributeDefinitions: [
        {
            AttributeName: "username",
            AttributeType: "S"
        },
        {
            AttributeName: "password",
            AttributeType: "S"
        }
    ],
    TableName: "oauth2user",
    KeySchema: [
        {
            AttributeName: "username",
            KeyType: "HASH"
        },
        {
            AttributeName: "password",
            KeyType: "RANGE"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 6,
        WriteCapacityUnits: 6
    }
};
```
