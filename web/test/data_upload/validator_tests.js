'use strict';
require('../helper');
const
  Validator       = require('../../src/modules/data_upload/validator'),
  fs              = require('fs');

describe('when validating an input object', function() {
  let poiServiceContent = fs.readFileSync(__dirname + '/../../fixtures/validator/poi_service_descriptor.json').toString();
  let vldt = new Validator(poiServiceContent);

  describe('an error should be reported if', function() {

    it ('the object does not have headers', function() {

      let expectedResult = {
        result: 'error',
        errors: ['Informações de cabeçalho do arquivo não encontradas']
      };

      return vldt.isContentValid({ values: [] }).should
              .eventually.deep.equal(expectedResult);

    });

    it('the object does not have values', function() {

      let expectedResult = {
        result: 'error',
        errors: ['Informações de registros do arquivo não encontradas']
      };

      return vldt.isContentValid({ headers: [] }).should
              .eventually.deep.equal(expectedResult);
    });

    it ('the object presents an inconsistent number of columns comparing headers and values', function() {

      let
        expectedResult = {
          result: 'error',
          errors: ['Número de colunas divergente entre cabeçalhos e campos']
        },
        content = {
          headers: ['1', '2', '3'],
          values: [
            ['1', '2', '3', '4']
          ]
        };

      return vldt.isContentValid(content).should
              .eventually.deep.equal(expectedResult);

    });

    it ('the object does not have a consistent number of columns on values', function() {

      let
        expectedResult = {
          result: 'error',
          errors: ['Número de colunas divergente para algumas linhas do arquivo']
        },
        content = {
          headers: ['1', '2', '3'],
          values: [
            ['1', '2'],
            ['1', '2', '3', '4']
          ]
        };

      return vldt.isContentValid(content).should
              .eventually.deep.equal(expectedResult);

    });

    it ('the object defines values to non-existent fields on feature service', function() {

      let
        expectedResult = {
          result: 'error',
          errors: [
            'O(s) campo(s) ESTACOLUNANAOEXISTE não existe(m) ' +
            'no serviço de dados espaciais. ' +
            'Remova estes campos do arquivo e re-execute a operação.'
          ]
        },
        content = {
          headers: ['ESTACOLUNANAOEXISTE', 'NAME', 'CITYID', 'INFO'],
          values: [
            [1,1,1,1]
          ]
        };

      return vldt.isContentValid(content).should
              .eventually.deep.equal(expectedResult);
    });

    it ('the object defines values to a non-editable field on feature service', function() {
      let
        expectedResult = {
          result: 'error',
          errors: [
            'Configurações do serviço de dados impedem ' +
            'que o(s) campo(s) NON_EDITABLE_NAME seja(m) armazenado(s). ' +
            'Remova estes campos do arquivo e re-execute a operação.'
          ]
        },
        content = {
          headers: ['NON_EDITABLE_NAME', 'NAME', 'CITYID', 'INFO'],
          values: [
            [1,1,1,1]
          ]
        };

      return vldt.isContentValid(content).should
              .eventually.deep.equal(expectedResult);

    });

    it ('the object does not have data for a not nullable field', function() {

      let
        expectedResult = {
          result: 'error',
          errors: [
            'O campo CITYID é obrigatório e não está presente no arquivo. ' +
            'O arquivo deve conter minimamente os campos NAME, CITYID.'
          ]
        },
        content = {
          headers: ['NAME'],
          values: [
            [1]
          ]
        };

      return vldt.isContentValid(content).should
              .eventually.deep.equal(expectedResult);

    });

    it ('the content has no present value for the PK specified by the user', function() {
      let
        vldt = new Validator(poiServiceContent, 'info'),
        content = {
          headers: ['NAME', 'CITYID', 'INFO'],
          values: [
            ['a','b','c'],
            [1,2,3],
            [4,5,6],
            [7,8,undefined]
          ]
        },
        expectedResult = {
          result: 'error',
          errors: ['O campo info foi informado como chave primária entretanto existem ' +
                  'linhas do arquivo que não possuem dados. O campo info deve possuir obrigatoriamente ' +
                  'valores para todas as linhas.']
        };

      return vldt.isContentValid(content).should
              .eventually.deep.equal(expectedResult);
    });
  });

  describe('with valid content', function() {

    describe('and no extra fields', function() {
      it ('the validation should report success and inform that there is no extra fields in the result', function() {
        let
          cityServiceContent = fs.readFileSync(__dirname + '/../../fixtures/validator/city_service_descriptor.json').toString(),
          cityWithoutExtraFields = fs.readFileSync(__dirname + '/../../fixtures/validator/city.json').toString(),
          content = JSON.parse(cityWithoutExtraFields),
          vldt = new Validator(cityServiceContent),
          expectedResult = {
            result:'success',
            errors: [],
            extrafields: []
          };

        return vldt.isContentValid(content).should
                .eventually.deep.equal(expectedResult);

      });
    });

  });

});
