'use strict';
require('../helper');
const
  tableLookup       = require('../../src/modules/esri_request/table_lookup'),
  fs                = require('fs'),
  ocorrenciaReturn  = fs.readFileSync(__dirname + '/../../fixtures/esri_request/table_lookup_return.json').toString(),
  nock              = require('nock');

describe('when performing a query', function() {

  describe('the promise should be rejected if', function() {
    it ('the moduleId parameter is not present', function() {
      return tableLookup.findOne({}).should.be.rejected;
    });

    it ('the moduleId is invalid', function() {
      let
        params = {
          moduleId: 3, // valid values for moduleId are 0, 1 and 2
          itemId: 123
        };

      return tableLookup.findOne(params).should.be.rejected;
    });

    it ('the itemId is not present', function() {
      let
        params = {
          moduleId: 0
        };

      return tableLookup.findOne(params).should.be.rejected;
    });
  });

  describe('if all mandatory fields are present and valid', function() {
    it('the promise should be fullfiled and a record must be returned', function() {
      let
        params = {
          moduleId: 0,
          itemId: '46329a70-e38e-479b-a5d6-be4e65a8880b'
        };

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'valid','expires_in':300});

      nock('http://services6.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/0/query')
        .reply(200, JSON.parse(ocorrenciaReturn));

      let expectedResult = {
        result: 'success',
        data: {
          feature: JSON.parse(ocorrenciaReturn)
        }
      };

      return tableLookup.findOne(params).should.eventually.deep.equal(expectedResult);
    });
  });

  describe('when the query could not be satisfied', function() {
    it ('no records should be returned', function() {
      let
        params = {
          moduleId: 0,
          itemId: '46329a70-e38e-479b-a5d6-be4e65a8880a'
        };

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'valid','expires_in':300});

      nock('http://services6.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/0/query')
        .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'GlobalID','features':[]});

      let expectedResult = {
        result: 'success',
        data: {
          feature: {
            features: [],
            globalIdFieldName: 'GlobalID',
            objectIdFieldName: 'OBJECTID'
          }
        }
      };

      return tableLookup.findOne(params).should.eventually.deep.equal(expectedResult);
    });

  });
});
