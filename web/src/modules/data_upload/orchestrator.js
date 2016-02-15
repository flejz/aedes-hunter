'use strict';

const
  util                    = require('util'),
  extractor               = require('../data_extract/extractor'),
  Validator               = require('./validator'),
  uploader                = require('./upload_handler'),
  Mailer                  = require('../ses_mailer/mailer'),
  winston                 = require('winston'),
  request                 = require('../esri_request/request'),
  tokenManager            = require('../security/token_manager');

module.exports = function(serviceUrl, operation, filePath, email, pk) {

  let
    appId               = process.env.AGOL_APPID,
    appSecret           = process.env.AGOL_APPSECRET,
    mailKey             = process.env.AWS_KEY,
    mailPwd             = process.env.AWS_SECRET,
    mailReg             = process.env.AWS_REGION,
    successMessage      = 'Processamento realizado com sucesso',
    errorMessage        = 'Erro durante o processamento',
    token               = null,
    content             = null,
    serviceDescriptor   = null;

  setImmediate(function () {
    Promise.all([

      tokenManager.getToken(appId, appSecret),
      extractor.confirmFromFile(filePath)

    ]).then(function(res) {

      token = res[0], content = res[1];
      return request.get(util.format('%s?f=pjson', serviceUrl), { token: token });

    }).then(function(sd) {

      serviceDescriptor = JSON.stringify(sd);
      return new Validator(serviceDescriptor, pk).isContentValid(content);

    }).then(function(res) {

      if (res.result !== 'success') {
        return new Promise(function(resolve) { resolve(res); });
      }

      let uploadData = {
        'serviceUrl': serviceUrl + '/',
        'serviceDescriptor': serviceDescriptor,
        'token': token,
        'operationType': operation,
        'primaryKey': pk,
        'ignoreFields': [],
        'headers': content.headers,
        'values': content.values
      };

      return uploader.upload(uploadData);

    }).then(function(res) {
      if (res.result !== 'success') {
        let emsg = res.errors.join(', ');
        winston.debug('(%s) %s: %s', email, errorMessage, emsg);
        return new Mailer(mailKey, mailPwd, mailReg).sendEmail(email, errorMessage, emsg, 'text');
      } else {
        winston.debug('(%s) %s', email, successMessage);
        return new Mailer(mailKey, mailPwd, mailReg).sendEmail(email, successMessage, successMessage, 'text');
      }
    }).catch(function(err) {
      // get error messages
      let msg = err.errors && err.errors.length ? err.errors.join(',') : 'Erro inesperado';
      if (err instanceof Error) {
        // if is an Error constructor, log message and stacktrace
        winston.error('(%s) Unexpected Error: %s\n%s', email, err.message, err.stack);
      } else {
        winston.error(msg);
      }
      return new Mailer(mailKey, mailPwd, mailReg).sendEmail(email, errorMessage, msg, 'text');
    });
  });
};
