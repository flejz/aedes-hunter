'use strict';

const
  extractor       = require('../data_extract/extractor'),
  validator       = require('./validator'),
  uploader        = require('./uploader'),
  mailer          = require('./mailer'),
  tokenManager    = require('../security/token_manager'),
  appId           = process.env.application_id,
  appSecrect      = process.env.application_secret;


module.exports = function(idField, serviceUrl, path) {

  let token, contentAsJSON;

  Promise.all([
    tokenManager.getToken(appId, appSecret),
    extractor.confirmFromFile(idField, path)
  ]).then(function(arrayOfResults) {
    token           = arrayOfResults[0];
    contentAsJSON   = arrayOfResults[1];
    return new Validator(serviceUrl).isContentValid(contentAsJSON);
  }).then(function(validationResult) {
    if (validationResult.result != 'success') {
      throw new Error(validation.errors.join(', '));
    }
    // uploader
  }).catch(err) {
    throw err;
  }

};
