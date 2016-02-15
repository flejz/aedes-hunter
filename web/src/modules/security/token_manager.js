'use strict';

const
  request       = require('request'),
  baseUrl       = 'https://www.arcgis.com/sharing/rest/oauth2/token/';

module.exports = {
  // Generated tokens by this method are short lived (5 min)
  getToken: function(clientId, clientSecret) {

    return new Promise(function(resolve, reject) {
      try {

        let responseContent = '';

        let postData = {
          'client_id': clientId,
          'client_secret': clientSecret,
          'grant_type': 'client_credentials',
          'expiration': 7200
        };

        request.post({url: baseUrl, form: postData})
          .on('error', function(err) {
            reject (err);
          })
          .on('data', function(data) {
            responseContent += data.toString();
          })
          .on('end', function() {
            let jsonResult = JSON.parse(responseContent);
            if (jsonResult['error']) {
              reject(Error('Acesso negado ao recurso'));
            } else {
              resolve(jsonResult['access_token']);
            }
          });

      } catch (e) {
        reject(e);
      }
    });
  }
};
