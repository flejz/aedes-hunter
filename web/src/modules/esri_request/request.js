
'use strict';

const
  request      = require('request');

module.exports = {

  get: function(url, json) {

    let responseContent = '';

    return new Promise(function(resolve, reject) {
      if (url === undefined || url === '') {
        reject(Error('Url de serviço não especificada'));
      }
      if (json === undefined || json === '') {
        json = {};
      }

      request({ url:url, form: json })
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
  },

  post: function(url, json) {

    let responseContent = '';

    return new Promise(function(resolve, reject) {
      if (url === undefined || url === '') {
        reject(Error('Url de serviço não especificada'));
      }

      if (json === undefined || json === '') {
        json = {};
      }

      request
        .post({ url: url, form: json})
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
  },
  extractContentAsJSON: function(url, json) {
    let responseContent = '';

    return new Promise(function(resolve, reject) {
      if (url === undefined || url === '') {
        reject(Error('Url de serviço não especificada'));
      }

      if (json === undefined || json === '') {
        json = {};
      }

      request({ url:url, form: json })
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
            resolve(jsonResult);
          }
        });
    });
  }
};
