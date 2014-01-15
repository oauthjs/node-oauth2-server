var Dal = function () {
  this.AWS = require('aws-sdk');
  this.AWS.config.loadFromPath(__dirname + '/aws.json');
  //change the endpoint to match your dynamodb endpoint
  this.db = new this.AWS.DynamoDB({
    endpoint: "https://dynamodb.us-east-1.amazonaws.com/"
  });
};

Dal.prototype = {
  decodeValue: function (map) {
    if (typeof map.N !== 'undefined')
      return parseFloat(map.N);
    if (typeof map.S !== 'undefined')
      return map.S;
    return map.Bl;
  },
  decodeValues: function (obj, vals) {
    var self = this;
    for (var key in vals) {
      if (vals.hasOwnProperty(key)) {
        obj[key] = self.decodeValue(vals[key]);
      }
    }
  },
  formatAttributes: function (obj) {
    var item = {};
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        if (obj[p] === 0 || typeof obj[p] == "number") {
          item[p] = {"N": obj[p].toString()};
        }
        else {
          item[p] = {"S": obj[p]};
        }
      }
    }
    return item;
  },
  deleteEmptyProperties: function (obj) {
    //DynamoDB does not allow you to store empty values
    for (var p in obj) {
      if (!obj.hasOwnProperty(p))
        continue;
      if (obj[p] !== 0 && (obj[p] === null || obj[p] === "")) {
        delete(obj[p]);
      }
    }
  },
  doGet: function (tableName, keyHash, consistent, callback) {
    consistent = typeof consistent !== 'undefined' ? consistent : false;
    var self = this;
    var result = this.db.getItem({
      TableName: tableName,
      Key: keyHash,
      ConsistentRead: consistent
    }, function (err, data) {
      var obj = {};
      if (err !== null) {
        if (callback) callback(err, null);
        return;
      }
      if (typeof data.Item != "undefined") {
        self.decodeValues(obj, data.Item);
      }
      if (callback) callback(err, obj);
    });
  },
  doSet: function (obj, tableName, keyHash, callback) {
    this.deleteEmptyProperties(obj);
    this.db.putItem({
      TableName: tableName,
      Item: this.formatAttributes(obj)
    }, function (err, data) {

      if (err !== null) return callback(err, null);
      callback(err, obj);
    });
  },
  doDelete: function (tableName, keyHash, callback) {
    this.db.deleteItem({
        TableName: tableName,
        Key: keyHash
      },
      function (err, data) {
        if (err !== null) {
          console.log(err);
        }
        if (callback) callback(err, data);
      });
  }
};

module.exports = new Dal();
