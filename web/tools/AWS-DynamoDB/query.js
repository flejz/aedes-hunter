'use strict';

const
  aws             = require('aws-sdk'),
  accessKeyId     = process.env.AWS_KEY,
  secretAccessKey = process.env.AWS_SECRET,
  factories       = require('../../src/modules/factories/factory'),
  Amazon          = require('../../src/modules/aws/configured_aws')

aws.config.accessKeyId = accessKeyId;
aws.config.secretAccessKey = secretAccessKey;
aws.config.region = 'us-east-1';

factories.register();
let
  amazon = new Amazon(),
  doc = amazon.dynDbDocumentClient(),
  params = {
    'TableName': 'Users',
    'KeyConditionExpression': '#mail = :email',
    'ExpressionAttributeNames': {
      '#mail': "email",
      '#pwd': 'password'
    },
    'FilterExpression': 'attribute_exists(#pwd)',
    'ExpressionAttributeValues': {
      ':email': 'foo@bar.com'
    }
  }

doc.query(params, function(err, data) {
  if (err) {
    console.log('Error querying user');
    console.log(JSON.stringify(err));
  } else {
    console.log('Success');
    data.Items.forEach(function(item) {
      console.log(item);
    });
  }
})
