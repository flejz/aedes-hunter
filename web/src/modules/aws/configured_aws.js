'use strict';

const
  wagner        = require('wagner-core');

module.exports = function(awsKey, awsSecret, awsRegion) {
  let
    key                 = (awsKey) ? awsKey : process.env.AWS_KEY,
    secret              = (awsSecret) ? awsSecret : process.env.AWS_SECRET,
    region              = (awsRegion) ? awsRegion : process.env.AWS_REGION,
    AWS                 = null;

  wagner.invoke(function(aws) {
    AWS = aws;
    AWS.config.apiVersion = 'latest';
    AWS.config.accessKeyId = key;
    AWS.config.secretAccessKey = secret;
    AWS.config.region = region;
  });

  return {
    root: function() {
      return wagner.invoke(function() {
        return AWS;
      });
    },

    dynDb: function() {
      return new AWS.DynamoDB();
    },

    dynDbDocumentClient: function() {
      return new AWS.DynamoDB.DocumentClient();
    },

    ses: function() {
      return new AWS.SES();
    }
  };
};
