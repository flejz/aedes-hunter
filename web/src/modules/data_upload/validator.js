'use strict';

const
  util            = require('util'),
  _               = require('lodash');

module.exports = function (serviceContent, fk) {

  let
    self = this,
    serviceContentJSON = JSON.parse(serviceContent),
    userDefinedForeignKey = (fk || '').toLowerCase();

  self.serviceDefinitionFields = function() {
    return serviceContentJSON.fields;
  };

  self.serviceDefinitionFieldNames = function() {
    return self.serviceDefinitionFields().map(function(element) {
      return element.name;
    });
  };

  self.edtFields = function() {
    return self.serviceDefinitionFields().filter(function(element) {
      return element.editable;
    });
  };

  self.editableFields = function() {
    return self.edtFields().map(function(item) {
      return item.name;
    });
  };

  self.nonNullableFields = function() {
    return self.edtFields().filter(function(element) {
      return !element.nullable;
    }).map(function(item) {
      return item.name;
    });
  };

  self.nullableFields = function() {
    return _.difference(self.editableFields(), self.nonNullableFields()).map(function(item) { return item.toLowerCase(); });
  };

  return {
    isContentValid: function(content) {
      return new Promise(function(resolve, reject) {
        try {
          // Validates mandatory fields on the evaluated object
          let mandatoryFieldsWithValidationMessages = {
            'headers': 'Informações de cabeçalho do arquivo não encontradas',
            'values': 'Informações de registros do arquivo não encontradas'
          };

          for (let item in mandatoryFieldsWithValidationMessages) {
            if (Object.keys(content).indexOf(item) === -1 || Object.keys(content).length === 0)
            {
              resolve({ 'result': 'error', 'errors': [mandatoryFieldsWithValidationMessages[item]]});
            }
          }

          // Validates if values has the same number of columns
          let headersColumns = content['headers'].length;
          let valuesColumnsArray = _.uniq(content['values'].map(function(x) { return x.length; }));

          if (valuesColumnsArray.length !== 1) {
            resolve({ 'result': 'error', 'errors': [ 'Número de colunas divergente para algumas linhas do arquivo'] });
          }

          // Validates if headers an values have the same number of columns
          let valuesColumns = valuesColumnsArray[0];

          if (headersColumns !== valuesColumns) {
            resolve({ 'result': 'error', 'errors': ['Número de colunas divergente entre cabeçalhos e campos']});
          }

          // Validates if the user passes-in any field that does not exist on the feature service and
          // rejects the promise if it does
          let commonEsriFields = ['OBJECTID', 'SHAPE', 'SHAPE_Leng', 'SHAPE_Area'];
          let extrafields = _.uniq(_.difference(_.difference(content.headers, commonEsriFields), self.serviceDefinitionFieldNames()));

          if (extrafields.length > 0) {
            resolve({
              'result': 'error',
              'errors': [util.format('O(s) campo(s) %s não existe(m) no serviço de dados espaciais. Remova estes campos do arquivo e re-execute a operação.',
                                     extrafields.join(', '))]
            });
          }


          // The validation of non-editable columns must be applied only to the subset of fields
          // present o service definition
          let contentHeadersPresentInServiceDefinition = _.intersection(_.difference(content.headers, ['OBJECTID', 'GlobalID']), self.serviceDefinitionFieldNames());

          // Validates if all fields present on evaluated object can be updated
          let uneditableFields = _.uniq(_.difference(contentHeadersPresentInServiceDefinition, self.editableFields()));
          if (uneditableFields.length > 0) {
            resolve({
              'result': 'error',
              'errors': [ util.format('Configurações do serviço de dados impedem que o(s) campo(s) %s ' +
                                    'seja(m) armazenado(s). Remova estes campos do arquivo e re-execute a operação.',
                                    uneditableFields.join(', ')) ]
            });
          }

          if (userDefinedForeignKey !== '') {

            if (self.nullableFields().indexOf(userDefinedForeignKey) > - 1) {
              // The user specified a nullable field for primary key.
              // All rows must contain a value other than null, empty space or undefined

              let
                deniedValues                            = ['', null, undefined],
                transposed                              = _.zip.apply(_, _.union([content.headers], content.values)),
                filtered                                = _.filter(transposed, function(item) {
                  return item[0].toLowerCase() === userDefinedForeignKey;
                })[0],
                errors                                  = _.intersection(deniedValues, _.uniq(_.drop(filtered, 1)));

              if (errors.length > 0) {
                resolve({
                  'result': 'error',
                  'errors': [util.format('O campo %s foi informado como chave primária entretanto existem ' +
                                         'linhas do arquivo que não possuem dados. O campo %s deve possuir obrigatoriamente ' +
                                         'valores para todas as linhas.', userDefinedForeignKey, userDefinedForeignKey)]
                });
              }
            }

          }

          // Validates file has data for every non-nullable column
          let mandatoryFields = self.nonNullableFields();
          let difference = _.difference(mandatoryFields, content.headers).length;
          if (difference > 0) {
            let errorMessage;
            if (difference == 1) {
              errorMessage = util.format('O campo %s é obrigatório e não está presente no arquivo. ' +
                                    'O arquivo deve conter minimamente os campos %s.',
                                    _.difference(mandatoryFields, content.headers).join(', '),
                                    mandatoryFields.join(', '));
            } else {
              errorMessage = util.format('Os campos %s são obrigatórios e não estão presentes no arquivo. ' +
                                    'O arquivo deve conter minimamente os campos %s.',
                                    _.difference(mandatoryFields, content.headers).join(', '),
                                    mandatoryFields.join(', '));
            }
            resolve({
              'result': 'error',
              'errors': [errorMessage]
            });
          }

          resolve({
            'result': 'success',
            'errors': [],
            'extrafields': []             // This array is currently intentionally blank because the uploader component
                                          // is not yet using this info. This is a placeholder for any aditional info that
                                          // will not be used for the service. The current behaviour is to reject the promise
                                          // if the user sents any 'extra' field (e.g. fields that does not exist in service definition)
          });
        } catch (err) {
          reject(err);
        }
      });
    }
  };
};
