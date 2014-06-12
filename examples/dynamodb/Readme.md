# DynamoDB Example

requires [`aws-sdk`](http://aws.amazon.com/sdkfornodejs/)

You will need to create the required tables (see below):

The object exposed in model.js could be directly passed into the model parameter of the config object when initiating.

For example:

```js
...

app.oauth = oauthserver({
  model: require('./model'),
  grants: ['password', 'refresh_token'],
  debug: true
});

...
```


#### Creating required tables in DynamoDB

```js
//
// Table definitions
//
var OAuth2AccessToken = {
  AttributeDefinitions: [
    {
      AttributeName: "accessToken",
      AttributeType: "S"
    }
  ],
  TableName: "oauth2accesstoken",
  KeySchema: [
    {
      AttributeName: "accessToken",
      KeyType: "HASH"
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 12,
    WriteCapacityUnits: 6
  }
};

var OAuth2RefreshToken = {
  AttributeDefinitions: [
    {
      AttributeName: "refreshToken",
      AttributeType: "S"
    }
  ],
  TableName: "oauth2refreshtoken",
  KeySchema: [
    {
      AttributeName: "refreshToken",
      KeyType: "HASH"
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 6,
    WriteCapacityUnits: 6
  }
};

var OAuth2AuthCode = {
  AttributeDefinitions: [
    {
      AttributeName: "authCode",
      AttributeType: "S"
    }
  ],
  TableName: "oauth2authcode",
  KeySchema: [
    {
      AttributeName: "authCode",
      KeyType: "HASH"
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 6,
    WriteCapacityUnits: 6
  }
};

var OAuth2Client = {
  AttributeDefinitions: [
    {
      AttributeName: "clientId",
      AttributeType: "S"
    }
  ],
  TableName: "oauth2client",
  KeySchema: [
    {
      AttributeName: "clientId",
      KeyType: "HASH"
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 6,
    WriteCapacityUnits: 6
  }
};


var OAuth2User = {
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
