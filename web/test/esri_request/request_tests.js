'use strict';
require('../helper');
const
  esriRequest     = require('../../src/modules/esri_request/request'),
  nock            = require('nock'),
  util            = require('util'),
  fs              = require('fs');

describe('when requesting a service definition', function() {

  const
    baseUrl       = 'http://services6.arcgis.com',
    action        = '/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/0',
    querystring   = {'f':'pjson'},
    url           = util.format('%s%s?f=pjson', baseUrl, action);

  describe ('with no service url', function() {
    it ('an error should be reported', function() {
      return esriRequest.extractContentAsJSON().should.be.rejectedWith('Url de serviço não especificada');
    });
  });

  describe ('with no token', function() {
    it ('an error should be reported', function() {

      nock(baseUrl)
        .get(action)
        .query(querystring)
        .reply(200, {'error':{'code':499,'message':'Token Required','messageCode':'GWM_0003','details':['Token Required']}});

      return esriRequest.extractContentAsJSON(url).should.be.rejectedWith('Acesso negado ao recurso');
    });
  });

  describe ('with an invalid token', function() {
    it ('an error should be reported', function() {

      nock(baseUrl)
        .get(action, 'token=dummy')
        .query(querystring)
        .reply(200,  {'error':{'code':498,'message':'Invalid token.','details':['Invalid token.']}});

      let token = { 'token': 'dummy' };

      return esriRequest.extractContentAsJSON(url, token).should.be.rejectedWith('Acesso negado ao recurso');
    });
  });

  describe ('with a valid json token', function() {
    it ('the url content should be retrieved', function() {

      let serviceContent = JSON.stringify(fs.readFileSync(__dirname + '/../../fixtures/validator/poi_service_descriptor.json').toString());

      nock(baseUrl)
        .get(action, 'token=validToken')
        .query(querystring)
        .reply(200,  serviceContent);

      let token = { 'token': 'validToken' };

      return esriRequest.extractContentAsJSON(url, token).should
              .eventually.deep.equal(JSON.parse(serviceContent));
    });
  });

});
