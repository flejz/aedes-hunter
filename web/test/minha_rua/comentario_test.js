'use strict';
require('../helper');
const
  comentario            = require('../../src/modules/minha_rua/comentario'),
  nock                  = require('nock');

describe('when adding a comment', function() {
  describe('with a not yet registered user', function() {
    it ('the promise should be resolved with an error description', function() {

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'validToken','expires_in':432000});

      nock('https://dynamodb.us-east-1.amazonaws.com:443')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/')
        .reply(200, {'Count':0,'Items':[],'ScannedCount':0});


      nock('http://services6.arcgis.com', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0/query')
        .query({'f':'json','where':'GlobalId%20%3D%20%2746329a70-e38e-479b-a5d6-be4e65a8880b%27','returnCountOnly':'true','token':'validToken'})
        .reply(200, {'count':1});

      let
        params = {
          email: 'invalid@foo.bar',
          occurrenceId: '46329a70-e38e-479b-a5d6-be4e65a8880b',
          comment: 'comment'
        };

      return comentario.add(params).should.eventually.
        deep.equal({
          result: 'error',
          error: ['E-mail informado não cadastrado']
        });

    });
  });

  describe('with an invalid occurrence id', function() {
    it ('the promise should be resolved with an error description', function() {

      nock('https://dynamodb.us-east-1.amazonaws.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/')
        .reply(200, {'Count':1,'Items':[{'password':{'S':'img'},'cartao_sus':{'S':'11111111'},'cpf':{'S':'111111'},'email':{'S':'rpepato@img.com.br'},'telefone':{'S':'(11) 1111-1111'},'nome':{'S':'Roberto Pepato'}}],'ScannedCount':1});

      let
        params = {
          email: 'rpepato@img.com.br',
          occurrenceId: '46329a70-eeee-479b-a5d6-be4e65a8880b',
          comment: 'comment'
        };

      return comentario.add(params).should.eventually.
        deep.equal({
          result: 'error',
          error: ['Identificador de ocorrência não encontrado']
        });

    });
  });

  describe('with valid user and occurence id', function() {
    it ('the comment should be saved and the promise should be resolved', function() {
      this.timeout(5000);
      let
        params = {
          email: 'rpepato@img.com.br',
          occurrenceId: '46329a70-e38e-479b-a5d6-be4e65a8880b',
          comment: 'comment'
        };

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'validToken','expires_in':432000});


      nock('https://dynamodb.us-east-1.amazonaws.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/')
        .reply(200, {'Count':1,'Items':[{'password':{'S':'img'},'cartao_sus':{'S':'11111111'},'cpf':{'S':'111111'},'email':{'S':'rpepato@img.com.br'},'telefone':{'S':'(11) 1111-1111'},'nome':{'S':'Roberto Pepato'}}],'ScannedCount':1});

      nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0/query')
        .query({'f':'json','where':'GlobalId%20%3D%20%2746329a70-e38e-479b-a5d6-be4e65a8880b%27','returnCountOnly':'true','token':'validToken'})
        .reply(200, {'count':1});

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'validToken','expires_in':432000});

      nock('http://services6.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/3/addFeatures')
        .reply(200, {'addResults':[{'objectId':21,'globalId':null,'success':true}]});


      return comentario.add(params).should.eventually.
        deep.equal({
          result: 'success',
          data: {
            objectId: 21
          }
        });
    });
  });
});

describe('when querying for comments', function() {
  describe('with valid occurenceId', function() {

    it('the recorded comments must be returned', function() {

      let
        expectedResult = { 'result':'success','data':[{'attributes':{'EMAIL':'rpepato@img.com.br','COMENT':'comment','DATA':1450809184033}}]};

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'validToken','expires_in':432000});

      nock('http://services6.arcgis.com', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/3/query')
        .query({'f':'json','where':'OCORR%20%3D%20%2746329a70-e38e-479b-a5d6-be4e65a8880b%27','outFields':'EMAIL%2CCOMENT%2CDATA','token':'validToken'})
        .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'','fields':[{'name':'EMAIL','type':'esriFieldTypeString','alias':'E-mail','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'COMENT','type':'esriFieldTypeString','alias':'Comentário','sqlType':'sqlTypeOther','length':500,'domain':null,'defaultValue':null},{'name':'DATA','type':'esriFieldTypeDate','alias':'Data','sqlType':'sqlTypeOther','length':8,'domain':null,'defaultValue':null}],'features':[{'attributes':{'EMAIL':'rpepato@img.com.br','COMENT':'comment','DATA':1450809184033}}]});

      return comentario.findAllForOcurrence('46329a70-e38e-479b-a5d6-be4e65a8880b').should.eventually.
        deep.equal(expectedResult);
    });
  });
});
