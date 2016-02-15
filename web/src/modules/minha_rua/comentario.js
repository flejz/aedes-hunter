'use strict';
const
  wagner    = require('wagner-core'),
  occurrences = require('./ocorrencia'),
  commentsUrl = 'http://services6.arcgis.com/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/3',
  util      = require('util');


module.exports = new function() {
  let
    self = this;

  return wagner.invoke(function(agolRequest, amazon){

    self.userExists = function(email) {
      return new Promise(function(resolve, reject) {

        var
          params = {
            'TableName': 'Users',
            'KeyConditionExpression': '#mail = :email',
            'ExpressionAttributeNames': {
              '#mail': 'email'
            },
            'ExpressionAttributeValues': {
              ':email': email.toLowerCase()
            }
          };

        return self.query(params).then(function(res) {
          resolve(res.Items.length > 0);
        }, function(err) {
          reject(err);
        });
      });
    },

    self.query = function(params) {
      return new Promise(function(resolve, reject){

        let
          doc = amazon.dynDbDocumentClient();

        doc.query(params, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });

      });
    },

    self.add = function(params) {
      return new Promise(function(resolve, reject) {

        let
          user = params['email'],
          occurrenceId = params['occurrenceId'],
          date = new Date().toJSON(),
          comment = params['comment'];

        return Promise.all([
          self.userExists(user),
          occurrences.exists(params['occurrenceId'])
        ]).then(function(results) {
          if (!results[0]) {
            resolve({
              result: 'error',
              error: ['E-mail informado não cadastrado']
            });
          }

          if (!results[1] || !results[1]['data']) {
            resolve({
              result: 'error',
              error: ['Identificador de ocorrência não encontrado']
            });
          }

          let
            commentsPostData = {
              f: 'json',
              features: JSON.stringify([ {
                attributes: {
                  EMAIL: user,
                  OCORR: occurrenceId,
                  COMENT: comment,
                  DATA: date
                }
              } ]),
              rollbackOnFailure: false
            },
            commentsPostUrl = util.format('%s/addFeatures', commentsUrl);

          return agolRequest.post(commentsPostUrl, commentsPostData).then(function(res){
            resolve({
              result: 'success',
              data: {
                objectId: res.addResults[0].objectId
              }
            });
          }, function(err) {
            reject({
              result: 'error',
              error: [err.message]
            });
          });

        }).catch(function(err) {
          reject(err);
        });
      });
    },

    self.findAllForOcurrence = function(occurrenceId) {
      return new Promise(function(resolve, reject) {

        let
          url = util.format('%s/query', commentsUrl),
          queryString = {
            f:          'json',
            where:      'OCORR = \'' + occurrenceId + '\'',
            outFields:  'EMAIL,COMENT,DATA'
          };

        return agolRequest.get(url, queryString).then(function(res) {
          resolve({
            result: 'success',
            data: res.features
          });
        }, function(err) {
          reject({
            result: 'error',
            error: [err.message]
          });
        });
      });
    };

    return {
      add: function(params) {
        return self.add(params);
      },

      findAllForOcurrence: function(occurrenceId) {
        return self.findAllForOcurrence(occurrenceId);
      }
    };
  });
};
