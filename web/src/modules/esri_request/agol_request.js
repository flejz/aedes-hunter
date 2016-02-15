'use strict';

const
  request      = require('request'),
  wagner       = require('wagner-core');

module.exports = function(appKey, appSecret) {
  let
    self = this,
    key = appKey || process.env.AGOL_APPID,
    secret = appSecret || process.env.AGOL_APPSECRET;

  self.executeRequest = function(tokenManager, requestOp, url, json) {

    return tokenManager.getToken(key, secret).then(function(token) {
      let responseContent = '';

      return new Promise(function(resolve, reject) {
        if (url === undefined || url === '') {
          reject(Error('Url de serviço não especificada'));
        }
        if (json === undefined || json === '') {
          json = {};
        }

        json['token'] = token;

        requestOp(url, json)
          .on('error', function(err) {
            reject (err);
          })
          .on('data', function(data) {
            responseContent += data.toString();
          })
          .on('end', function() {
            let jsonResult = JSON.parse(responseContent);
            if (jsonResult['error']) {
              reject(Error(responseContent));
            } else {
              resolve(jsonResult);
            }
          });
      });
    }).catch(function(err) {
      throw err;
    });
  };

  return wagner.invoke(function(tokenManager) {
    return {
      get: function(url, json) {
        return self.executeRequest(tokenManager, function(url, qs) {
          return request({ url:url, qs: qs});
        }, url, json);
      },

      post: function(url, json) {
        return self.executeRequest(tokenManager, function(url, json) {
          return request
            .post({ url: url, form: json});
        }, url, json);
      }
    };
  });
};
