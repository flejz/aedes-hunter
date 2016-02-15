'use strict';

const
  aws             = require('aws-sdk'),
  accessKeyId     = process.env.AWS_KEY,
  secretAccessKey = process.env.AWS_SECRET;

aws.config.accessKeyId = accessKeyId;
aws.config.secretAccessKey = secretAccessKey;
aws.config.region = 'us-east-1';

let
  dynDB = new aws.DynamoDB(),
  params = {
    TableName: "Users",
    KeySchema: [
      { AttributeName: "email", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "email", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
  }

dynDB.listTables(function(err, data) {
  if (err) {
    console.log('oh oh, something went wrong...');
    console.log(JSON.stringify(err));
  } else {
    if (data.TableNames.indexOf("Users") > -1) {
      console.log ('Table "Users" already exists');
    } else {
      dynDB.createTable(params, function(err, data) {
        if (err) {
          console.log('Error creating users table');
          console.log(JSON.stringify(err));
        } else {
          console.log('Users table created.');
          console.log('Table description: ' + JSON.stringify(data));
        }
      });
    }
  }
});
