'use strict';

const
  wagner        = require('wagner-core'),
  tokenManager  = require('../security/token_manager'),
  Amazon        = require('../aws/configured_aws'),
  AgolRequest   = require('../esri_request/agol_request'),
  aws           = require('aws-sdk');

module.exports = {
  register: function() {

    wagner.factory('aws', function() {
      return aws;
    });

    wagner.factory('amazon', function() {
      return new Amazon();
    });

    wagner.factory('agolRequest', function() {
      return new AgolRequest();
    });

    wagner.factory('tokenManager', function() {
      return tokenManager;
    });

  }
};
