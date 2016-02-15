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
    TableName: "Users"
  }

dynDB.listTables(function(err, data) {
  if (err) {
    console.log('oh oh, something went wrong...');
    console.log(JSON.stringify(err));
  } else {
    if (data.TableNames.indexOf("Users") === -1) {
      console.log ('Table "Users" does not exists');
    } else {
      dynDB.deleteTable(params, function(err, data) {
        if (err) {
          console.log('Error deleting users table');
          console.log(JSON.stringify(err));
        } else {
          console.log('Users table deleted.');
        }
      });
    }
  }
});
