'use strict';
require('../helper');
const
  ocorrencia            = require('../../src/modules/minha_rua/ocorrencia'),
  fs                    = require('fs'),
  agolUserQuery         = fs.readFileSync(__dirname + '/../../fixtures/minha_rua/agol_user_query.json').toString(),
  dynamoUserQuery         = fs.readFileSync(__dirname + '/../../fixtures/minha_rua/dynamo_user_query.json').toString(),
  nock                  = require('nock');

describe('when querying for records existance', function() {
  describe('the promise should be resolved', function() {

    it ('and return true when record exists', function() {

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'validToken','expires_in':432000});

      nock('http://services6.arcgis.com', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0/query')
        .query({'f':'json','where':'GlobalId%20%3D%20%2746329a70-e38e-479b-a5d6-be4e65a8880b%27','returnCountOnly':'true','token':'validToken'})
        .reply(200, {'count':1});

      return ocorrencia.exists('46329a70-e38e-479b-a5d6-be4e65a8880b').
        should.eventually.deep.equal({
          result: 'success',
          data: true
        });
    });

    it ('and return false when record does not exists', function() {

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'validToken','expires_in':432000});

      nock('http://services6.arcgis.com', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0/query')
        .query({'f':'json','where':'GlobalId%20%3D%20%2746329a70-0000-479b-a5d6-be4e65a8880b%27','returnCountOnly':'true','token':'validToken'})
        .reply(200, {'count':0});

      return ocorrencia.exists('46329a70-0000-479b-a5d6-be4e65a8880b').
        should.eventually.deep.equal({
          result: 'success',
          data: false
        });
    });
  });
});

describe('when querying a list of occurrences for a email', function() {
  describe('and no occurrences exist', function() {
    it ('the promise should be resolved with an empty list', function() {

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'valid','expires_in':7200});


      nock('http://services6.arcgis.com', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0/query')
        .query({'f':'json','where':'IDUSUA%20%3D%20%27invalid%40email.com%27','outFields':'GlobalId%2CTIPOOCR%2CTITULO%2CCOMENT%2CSTATUS','token':'valid'})
        .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'GlobalID','features':[]});

      return ocorrencia.list('invalid@email.com').should.eventually.
        deep.equal({
          result: 'success',
          data: []
        });
    });
  });

  describe('with occurrences already recorded', function() {
    it ('the promise should be resolved with a list of users occurrences', function() {

      nock('https://www.arcgis.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .reply(200, {'access_token':'valid','expires_in':300});

      nock('http://services6.arcgis.com', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0/query')
        .query({'f':'json','where':'IDUSUA%20%3D%20%27valid%40email.com%27','outFields':'GlobalId%2CTIPOOCR%2CTITULO%2CCOMENT%2CSTATUS','token':'valid'})
        .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'GlobalID','geometryType':'esriGeometryPoint','spatialReference':{'wkid':102100,'latestWkid':3857},'fields':[{'name':'GlobalID','type':'esriFieldTypeGlobalID','alias':'GlobalID','sqlType':'sqlTypeOther','length':38,'domain':null,'defaultValue':null},{'name':'TIPOOCR','type':'esriFieldTypeSmallInteger','alias':'Tipo Ocorrência','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'TPO','codedValues':[{'name':'Acessibilidade','code':0},{'name':'Água','code':1},{'name':'Árvore','code':2},{'name':'Barulho','code':3},{'name':'Coleta de Lixo','code':4},{'name':'Convservação / Manutenção','code':5},{'name':'Educação','code':6},{'name':'Empresa Irregular','code':7},{'name':'Esgoto','code':8},{'name':'Ilumnicação e Energia','code':9},{'name':'Limpeza Urbana','code':10},{'name':'Obra / Ocupação Irregular','code':11},{'name':'Obra Pública','code':12},{'name':'Pavimentação','code':13},{'name':'Pedestre e Ciclistas','code':14},{'name':'Poda e Capina','code':15},{'name':'Poluição','code':16},{'name':'Queimada','code':17},{'name':'Ruas e Estradas','code':18},{'name':'Saúde','code':19},{'name':'Segurança','code':20},{'name':'Sinalização','code':21},{'name':'Trânsito','code':22},{'name':'Transporte Público','code':23},{'name':'Varrição','code':24}]},'defaultValue':null},{'name':'TITULO','type':'esriFieldTypeString','alias':'Título','sqlType':'sqlTypeOther','length':250,'domain':null,'defaultValue':null},{'name':'COMENT','type':'esriFieldTypeString','alias':'Comentário','sqlType':'sqlTypeOther','length':600,'domain':null,'defaultValue':null},{'name':'STATUS','type':'esriFieldTypeSmallInteger','alias':'Status','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'STO','codedValues':[{'name':'Aberta','code':0},{'name':'Em Andamento','code':1},{'name':'Fechada','code':2}]},'defaultValue':null}],'features':[{'attributes':{'GlobalID':'46329a70-e38e-479b-a5d6-be4e65a8880b','TIPOOCR':2,'TITULO':' Árvore Tocando a Rede Elétrica','COMENT':' ','STATUS':0},'geometry':{'x':-5107456.158950525,'y':-2655641.8521160996}}]});

      let
        expectedResult = {
          result: 'success',
          data: [
            {
              'attributes': {
                'COMENT': ' ',
                'GlobalID': '46329a70-e38e-479b-a5d6-be4e65a8880b',
                'STATUS': 0,
                'TIPOOCR': 2,
                'TITULO': ' Árvore Tocando a Rede Elétrica'
              },
              'geometry': {
                'x': -5107456.158950525,
                'y': -2655641.8521160996
              }
            }
          ]
        };
      return ocorrencia.list('valid@email.com').should.eventually.
        deep.equal(expectedResult);
    });
  });
});

describe('when inserting a registry', function() {
  describe('without mandatory attributes', function() {
    let
      params = {};

    it('the promisse should be rejected', function() {
      return ocorrencia.insert(params).should.be.rejected;
    });
  });

  describe('with mandatory attributes present', function() {
    let
      params = {
        'geometry': {
          'x':-5351814.972413478,
          'y':-1056665.4790139832,
          'spatialReference': {
            'wkid':102100
          }
        },
        'attributes': {
          'TIPOOCR':1,
          'TITULO':'TITULO',
          'COMENT':'COMENTARIO',
          'IDUSUA':'rpepato@img.com.br'
        }
      };

    describe('and a non registered email account', function() {

      params['attributes']['IDUSUA'] = 'invalid@foo.com';

      it ('the promise should be rejected', function() {

        nock('https://www.arcgis.com:443', {'encodedQueryParams':true})
          .filteringRequestBody(function() {
            return '*';
          }).post('/sharing/rest/oauth2/token/')
          .reply(200, {'access_token':'sJyR3S1McBWcrJvMqLgBpOgCNm-nQAjwdgAviN5TMNz9j77-gYCiBdLFM6ohwfccf-BAut8-BOmVs-8azDavTKgACL5AyxKLsg9Ng3MmjQVxCycFGnpelJh0DTBxX4FQ3T61amVFCdAci60KqRnFnw..','expires_in':300});

        nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/um4RQnU40VyzFeR6/arcgis/rest/services/servidores/FeatureServer/0/query')
          .reply(200, {'objectIdFieldName':'FID','globalIdFieldName':'','features':[]});

        nock('https://dynamodb.us-east-1.amazonaws.com:443', {'encodedQueryParams':true})
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/')
          .reply(200, {'Count':0,'Items':[],'ScannedCount':0});

        return ocorrencia.insert(params).should.eventually.deep.equal({
          result: 'error',
          error: 'Usuário inválido.'
        });
      });

    });

    describe('and a registered user account', function() {

      params['attributes']['IDUSUA'] = 'rpepato@img.com.br';

      it ('the department and position fields should be present on the insert request', function() {

        nock('https://www.arcgis.com')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/sharing/rest/oauth2/token/')
          .reply(200, {
            'access_token':'hCSp8E5-M_27NvPisUFb9Q3eWH0UMWxlLKyNgVxTJyqhTXqdD7t4rM_LP_ShjugvbMjnbJy5sQc1ADHcaY_1Ji6WeDFxEy-qn9ys5WWz9A6UJ_O95_YJMsq0zB_KEo6wVTCugXdm-q2jzHeZk28DDA..',
            'expires_in':300
          });

        nock('http://services6.arcgis.com')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/um4RQnU40VyzFeR6/arcgis/rest/services/servidores/FeatureServer/0/query')
          .reply(200, agolUserQuery);

        nock('https://dynamodb.us-east-1.amazonaws.com:443', {'encodedQueryParams':true})
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/')
            .reply(200, dynamoUserQuery);

        nock('https://www.arcgis.com')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/sharing/rest/oauth2/token/')
          .reply(200, {
            'access_token':'hCSp8E5-M_27NvPisUFb9Q3eWH0UMWxlLKyNgVxTJyqhTXqdD7t4rM_LP_ShjugvbMjnbJy5sQc1ADHcaY_1Ji6WeDFxEy-qn9ys5WWz9A6UJ_O95_YJMsq0zB_KEo6wVTCugXdm-q2jzHeZk28DDA..',
            'expires_in':300
          });

        nock('http://services6.arcgis.com')
          .filteringRequestBody(function() {
            return '*';
          })
          .post('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/0/addFeatures')
          .reply(200, {'addResults':[{'objectId':63,'globalId':'E6192155-D06F-4187-B9AB-D68E71C6AEE7','success':true}]});

        return ocorrencia.insert(params).should.eventually.deep.equal({
          result: 'success',
          data: {
            objectId: 63
          }
        });
      });
    });
  });
});
