'use strict';

const
  wagner       = require('wagner-core'),
  util         = require('util'),
  _            = require('lodash');

module.exports = new function() {
  let
    self = this,
    tableLookupBaseUrl = 'http://services6.arcgis.com/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer',
    MINHA_RUA = 'Minha Rua',
    SERVICOS = 'Serviços ao Cidadão',
    ACOES = 'Ações do Município',
    sysModulesTableLookupIndexes = {
      0: MINHA_RUA,
      1: SERVICOS,
      2: ACOES
    };

  return wagner.invoke(function(agolRequest) {

    self.findOne = function(params) {
      return new Promise(function(resolve, reject) {
        if (!params || !params.hasOwnProperty('moduleId') || !params['moduleId'] == 'undefined') {
          reject({
            result: 'error',
            error: ['Identificador do módulo do sistema não encontrado']
          });
        }

        if (!params || !params.hasOwnProperty('itemId') || !params['itemId'] == 'undefined') {
          reject({
            result: 'error',
            error: ['Identificador do item de busca não encontrado']
          });
        }

        if (_.keys(sysModulesTableLookupIndexes).indexOf(params['moduleId'].toString()) === -1) {
          reject({
            result: 'error',
            error: ['O código de módulo informado (' + params['moduleId'] + ') não é suportado']
          });
        }

        let
          moduleId = params['moduleId'],
          itemId  = params['itemId'],
          url = util.format('%s/%s/query', tableLookupBaseUrl, moduleId),
          postData = {
            where:                  util.format('GlobalID = \'%s\'', itemId),
            outFields:              '[*]',
            returnIdsOnly:          false,
            returnCountOnly:        false,
            returnDistinctValues:   false,
            f:                      'json'
          };

        return agolRequest.post(url, postData).then(function(res) {
          resolve({
            result: 'success',
            data: {
              feature: res
            }
          });
        }, function(err) {
          reject(err);
        });
      });

    };

    return {
      findOne: function(params) {
        return self.findOne(params);
      },
      getUrl: function (moduleId) {
        if (_.keys(sysModulesTableLookupIndexes).indexOf(moduleId.toString()) === -1 ) {
          throw Error('Invalid Module');
        }
        return util.format('%s/%s', tableLookupBaseUrl, moduleId);
      }
    };
  });
};
