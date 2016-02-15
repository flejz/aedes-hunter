'use strict';
const
  wagner          = require('wagner-core'),
  usersTableUrl   = 'http://services6.arcgis.com/um4RQnU40VyzFeR6/arcgis/rest/services/servidores/FeatureServer/0',
  occurencesUrl   = 'http://services6.arcgis.com/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0',
  util            = require('util');


module.exports = new function() {
  let self = this;

  return wagner.invoke(function(agolRequest, amazon){
    self.ocorrenciaEixo = {
      0:  5,
      1:  0,
      2:  1,
      3:  1,
      4:  4,
      5:  4,
      6:  2,
      7:  4,
      8:  0,
      9:  3,
      10: 4,
      11: 6,
      12: 4,
      13: 5,
      14: 5,
      15: 4,
      16: 1,
      17: 1,
      18: 6,
      19: 8,
      20: 9,
      21: 5,
      22: 5,
      23: 5,
      24: 4
    },

    self.eixo = function(index) {
      let
        item = self.ocorrenciaEixo[index];

      if (item === undefined) {
        throw Error('Eixo não encontrado');
      }

      return item;
    },

    self.agolRecordForMail = function(mail) {
      let
        url = util.format('%s/query', usersTableUrl),
        postData = {
          where:                  util.format('email = \'%s\'', mail),
          outFields:              '[*]',
          returnIdsOnly:          false,
          returnCountOnly:        false,
          returnDistinctValues:   false,
          f:                      'json'
        };

      return agolRequest.post(url, postData);
    },

    self.amazonRecordForMail = function(mail) {
      return new Promise(function(resolve){
        let
          doc = amazon.dynDbDocumentClient(),
          params = {
            'TableName': 'Users',
            'KeyConditionExpression': '#mail = :email',
            'ExpressionAttributeNames': {
              '#mail': 'email'
            },
            'ExpressionAttributeValues': {
              ':email': mail.toLowerCase()
            }
          };

        doc.query(params, function(err, data) {
          if (err) {
            throw err;
          } else {
            if (data.Items.length !== 1) {
              resolve({
                result: 'error',
                error: 'Usuário inválido.'
              });
            } else {
              resolve({
                result: 'success',
                data: data.Items[0]
              });
            }
          }
        });
      });
    },

    self.listOccurrencesForEmail = function(email) {
      return new Promise(function(resolve, reject) {
        let url = util.format('%s/query', occurencesUrl);
        let queryString = {
          f:          'json',
          where:      'IDUSUA = \'' + email.toLowerCase() + '\'',
          outFields:  'GlobalId,TIPOOCR,TITULO,COMENT,STATUS,VALID'
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
    },

    self.insert = function(parameters) {
      return new Promise(function(resolve, reject){

        let
          mandatoryAttributes = ['IDUSUA', 'TITULO', 'COMENT'];

        mandatoryAttributes.forEach(function(attr){
          if (!parameters['attributes'] || !parameters['attributes'][attr]) {
            reject({
              result: 'error',
              error: util.format('Campo "%s" não informado. Não foi possível inserir a ocorrência.', attr)
            });
          }
        });

        return self.agolRecordForMail(parameters['attributes']['IDUSUA']).then(function(agolData) {
          if (agolData.features.length !== 1) {
            parameters['attributes']['TPUSUA']       = 0; // tipo de usuário - cidadão
          } else {
            parameters['attributes']['TPUSUA']       = 1; // tipo de usuário - servidor

            if (agolData.features[0]['attributes']['nome']) {
              parameters['attributes']['NOME'] = agolData.features[0]['attributes']['nome'];
            }

            if (agolData.features[0]['attributes']['departamento']) {
              parameters['attributes']['DEPTO'] = agolData.features[0]['attributes']['departamento'];
            }

            if (agolData.features[0]['attributes']['cargo']) {
              parameters['attributes']['CARGO'] = agolData.features[0]['attributes']['cargo'];
            }

          }

          return self.amazonRecordForMail(parameters['attributes']['IDUSUA']);
        }).then(function(amazonResult) {
          if (amazonResult.result == 'error') {
            resolve(amazonResult);
          }

          let
            data = amazonResult['data'];

          if (data['cartao_sus']) {
            parameters['attributes']['CARSUS'] = data['cartao_sus'];
          }

          if (data['cpf']) {
            parameters['attributes']['CPF'] = data['cpf'];
          }

          parameters['attributes']['UPVOTE']          = 0;
          parameters['attributes']['DOWNVO']          = 0;
          parameters['attributes']['PJPG']            = 0;
          parameters['attributes']['ATIVID']          = 0;
          parameters['attributes']['STATUS']          = 0;
          parameters['attributes']['DTABER']          = new Date().toJSON();
          parameters['attributes']['PLAGOV']          = 0;
          parameters['attributes']['ACAPRIO']         = 0;
          parameters['attributes']['VALID']           = 0; // Status de validação da ocorrência - 0 = não verificada
          parameters['attributes']['EIXO']            = self.eixo(parameters['attributes']['TIPOOCR']);
          parameters['attributes']['PRIORIDA']        = 0; // 0 = Não definido

          let
            ocurrencesPostData = {
              f: 'json',
              features: JSON.stringify([ parameters ]),
              rollbackOnFailure: false
            },
            occurencesPostUrl = util.format('%s/addFeatures', occurencesUrl);

          return agolRequest.post(occurencesPostUrl, ocurrencesPostData);
        }).then(function(result) {
          if (result && !result.addResults[0].success) {
            reject({
              result : 'error',
              error  : result.addResults[0].error.description
            });
          } else {
            resolve ({
              result: 'success',
              data: {
                objectId: result.addResults[0].objectId
              }
            });
          }
        }).catch(function(err) {
          reject(err);
        });
      });
    },

    self.exists = function(id) {
      return new Promise(function(resolve, reject) {
        let url = util.format('%s/query', occurencesUrl);
        let queryString = {
          f:          'json',
          where:      'GlobalId = \'' + id + '\'',
          returnCountOnly: true
        };
        return agolRequest.get(url, queryString).then(function(res) {
          resolve({
            result: 'success',
            data: res['count'] > 0
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
      insert: function(params) {
        return self.insert(params);
      },

      list: function(email) {
        return self.listOccurrencesForEmail(email);
      },

      exists: function(id) {
        return self.exists(id);
      }
    };
  });
};
