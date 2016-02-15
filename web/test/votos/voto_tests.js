'use strict';

require('../helper');

const
  svc             = require('../../src/modules/votos/voto'),
  nock            = require('nock'),
  chai            = require('chai'),
  chaiAsPromised  = require('chai-as-promised');

chai.should();
chai.use(chaiAsPromised);

describe('when I vote', function () {
  describe('and there is no vote', function () {
    it('the vote must be successfully inserted', function () {
      this.timeout(10000);

      nock('https://www.arcgis.com:443', {'encodedQueryParams':true})
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/sharing/rest/oauth2/token/')
        .twice()
        .reply(200, {'access_token':'validToken','expires_in':7200});

      nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/4/Query')
        .query({'f':'json','outFields':'%2A','where':'EMAIL%3D%27avidotto%40gmail.com%27%20AND%20ITEM%3D%2799e06604-5e73-4ae9-9017-59df50a37c45%27%20AND%20MODULO%3D0','token':'validToken'})
        .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'','features':[]});

      nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/4/addFeatures')
        .reply(200, {'addResults':[{'objectId':2,'globalId':null,'success':true}]});

      let model = {
        MODULO : 0,
        EMAIL  : 'avidotto@gmail.com',
        ITEM   : '99e06604-5e73-4ae9-9017-59df50a37c45',
        DATA   : (new Date()).toJSON(),
        VOTO   : -1
      };

      return svc.submit(model).should.eventually.deep.equal({'result':'success','data':{'addResults':[{'objectId':2,'globalId':null,'success':true}]}});
    });
  });
  describe('and vote exists', function () {
    it('an error should be reported', function () {

      nock('https://www.arcgis.com:443', {'encodedQueryParams':true})
        .post('/sharing/rest/oauth2/token/', 'client_id=GJcVOr6llgygZuqJ&client_secret=104e5dc285e04c429d06dd24f91bf5d4&grant_type=client_credentials&expiration=7200')
        .reply(200, {'access_token':'validToken','expires_in':7200});

      nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
        .get('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/4/Query')
        .query({'f':'json','outFields':'%2A','where':'EMAIL%3D%27avidotto%40gmail.com%27%20AND%20ITEM%3D%2799e06604-5e73-4ae9-9017-59df50a37c44%27%20AND%20MODULO%3D0','token':'validToken'})
        .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'','fields':[{'name':'OBJECTID','type':'esriFieldTypeOID','alias':'OBJECTID','sqlType':'sqlTypeOther','domain':null,'defaultValue':null},{'name':'MODULO','type':'esriFieldTypeSmallInteger',
                     'alias':'Módulo','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'MOD','codedValues':[{'name':'Minha Rua','code':0},{'name':'Ações do Município','code':1},{'name':'Serviços ao Cidadão','code':2}]},'defaultValue':null},
                     {'name':'ITEM','type':'esriFieldTypeGUID','alias':'Item','sqlType':'sqlTypeOther','length':38,'domain':null,'defaultValue':null},{'name':'EMAIL','type':'esriFieldTypeString','alias':'E-mail','sqlType':'sqlTypeOther',
                     'length':50,'domain':null,'defaultValue':null},{'name':'DATA','type':'esriFieldTypeDate','alias':'Data','sqlType':'sqlTypeOther','length':8,'domain':null,'defaultValue':null},{'name':'VOTO','type':'esriFieldTypeSmallInteger','alias':'Voto',
                     'sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'VOT','codedValues':[{'name':'Down','code':-1},{'name':'Up','code':1}]},'defaultValue':null}],'features':[{'attributes':{'OBJECTID':1,'MODULO':0,'ITEM':'99e06604-5e73-4ae9-9017-59df50a37c44',
                     'EMAIL':'avidotto@gmail.com','DATA':1450880224027,'VOTO':-1}}]});

      let model = {
        MODULO : 0,
        EMAIL  : 'avidotto@gmail.com',
        ITEM   : '99e06604-5e73-4ae9-9017-59df50a37c44',
        DATA   : (new Date()).toJSON(),
        VOTO   : -1
      };

      return svc.submit(model).should.be.rejected.and.eventually.have.property('error', 'Usuário já votou neste item');
    });
  });
  it('the total of votes must be updated', function () {

    this.timeout(20000);

    nock('https://www.arcgis.com:443', {'encodedQueryParams':true})
      .post('/sharing/rest/oauth2/token/', 'client_id=GJcVOr6llgygZuqJ&client_secret=104e5dc285e04c429d06dd24f91bf5d4&grant_type=client_credentials&expiration=7200')
      .reply(200, {'access_token':'Nntikt0B8PJ1AhCvjfTqpbY0v1t4YkGX7VrD86w7PF1Rsb4WbQiobzl3IvGXbDC4RuyDVuWxvW7LoBnDbPn5zgKjhDV2fhj3rhMIy45orsJyD51iegqM8X8aasGJEqigjBGpRlA6UaElod4Dai2Thg..','expires_in':7200}, { 'cache-control': 'no-cache, no-store, must-revalidate',
      'content-type': 'text/plain;charset=utf-8',
      date: 'Mon, 28 Dec 2015 17:19:43 GMT',
      expires: '0',
      pragma: 'no-cache',
      server: 'ArcGISOnline',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '1; mode=block',
      'content-length': '188',
      connection: 'Close' });

    nock('https://www.arcgis.com:443', {'encodedQueryParams':true})
      .post('/sharing/rest/oauth2/token/', 'client_id=GJcVOr6llgygZuqJ&client_secret=104e5dc285e04c429d06dd24f91bf5d4&grant_type=client_credentials&expiration=7200')
      .reply(200, {'access_token':'qfWf8J78JHsQ3caTXiSC5XwYqvLG3ROidvqoo5CF0mYxLBSf-amssZSsiUfMW8-nIfs6dxohb7_3CkfBxZl2GHiARguCfEehCAPCQV9u22J1q3yrKqVz9XluZ1adN_5v','expires_in':7200}, { 'cache-control': 'no-cache, no-store, must-revalidate',
      'content-type': 'text/plain;charset=utf-8',
      date: 'Mon, 28 Dec 2015 17:19:44 GMT',
      expires: '0',
      pragma: 'no-cache',
      server: 'ArcGISOnline',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '1; mode=block',
      'content-length': '164',
      connection: 'Close' });

    nock('https://www.arcgis.com:443', {'encodedQueryParams':true})
      .post('/sharing/rest/oauth2/token/', 'client_id=GJcVOr6llgygZuqJ&client_secret=104e5dc285e04c429d06dd24f91bf5d4&grant_type=client_credentials&expiration=7200')
      .reply(200, {'access_token':'0XfIPb32sKCuWWN70ECApurav5nYvoqSnhRxU7dHQEjMhLhtl2XxslLUP1GBzmibQiXhDldUZ0x64NIkVl_saYvLlPeHbh7dzVqPCwZtVverHihAQDBimaq868V62iNK3NCvXng5ECGedC8YbGMmwg..','expires_in':299}, { 'cache-control': 'no-cache, no-store, must-revalidate',
      'content-type': 'text/plain;charset=utf-8',
      date: 'Mon, 28 Dec 2015 17:19:44 GMT',
      expires: '0',
      pragma: 'no-cache',
      server: 'ArcGISOnline',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '1; mode=block',
      'content-length': '188',
      connection: 'Close' });

    nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
      .get('/um4RQnU40VyzFeR6/ArcGIS/rest/services/pdg_dev_service/FeatureServer/3/query')
      .query({'f':'json','where':'OCORR%20%3D%20%2746329a70-e38e-479b-a5d6-be4e65a8880b%27','outFields':'EMAIL%2CCOMENT%2CDATA','token':'Nntikt0B8PJ1AhCvjfTqpbY0v1t4YkGX7VrD86w7PF1Rsb4WbQiobzl3IvGXbDC4RuyDVuWxvW7LoBnDbPn5zgKjhDV2fhj3rhMIy45orsJyD51iegqM8X8aasGJEqigjBGpRlA6UaElod4Dai2Thg..'})
      .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'','fields':[{'name':'EMAIL','type':'esriFieldTypeString','alias':'E-mail','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'COMENT','type':'esriFieldTypeString','alias':'Comentário','sqlType':'sqlTypeOther','length':500,'domain':null,'defaultValue':null},{'name':'DATA','type':'esriFieldTypeDate','alias':'Data','sqlType':'sqlTypeOther','length':8,'domain':null,'defaultValue':null}],'features':[{'attributes':{'EMAIL':'rpepato@img.com.br','COMENT':'comment','DATA':1450809184033}},{'attributes':{'EMAIL':'rpepato@img.com.br','COMENT':'comment','DATA':1450809297620}},{'attributes':{'EMAIL':'rpepato@img.com.br','COMENT':'Descrição do Comentário','DATA':1450810706608}},{'attributes':{'EMAIL':'rpepato@img.com.br','COMENT':'comment','DATA':1450870955189}}]}, { 'content-type': 'text/plain; charset=utf-8',
      etag: '738200023',
      server: 'Microsoft-IIS/8.5',
      'x-powered-by': 'ASP.NET',
      'access-control-allow-origin': '*',
      date: 'Mon, 28 Dec 2015 17:19:44 GMT',
      connection: 'close',
      'content-length': '845' });

    nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
      .get('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/4/Query')
      .query({'f':'json','outFields':'%2A','where':'EMAIL%3D%27avidotto%40gmail.com%27%20AND%20ITEM%3D%2746329a70-e38e-479b-a5d6-be4e65a8880b%27%20AND%20MODULO%3D0','token':'0XfIPb32sKCuWWN70ECApurav5nYvoqSnhRxU7dHQEjMhLhtl2XxslLUP1GBzmibQiXhDldUZ0x64NIkVl_saYvLlPeHbh7dzVqPCwZtVverHihAQDBimaq868V62iNK3NCvXng5ECGedC8YbGMmwg..'})
      .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'','features':[]}, { 'content-type': 'text/plain; charset=utf-8',
      etag: '1470426887',
      server: 'Microsoft-IIS/8.5',
      'x-powered-by': 'ASP.NET',
      'access-control-allow-origin': '*',
      date: 'Mon, 28 Dec 2015 17:19:45 GMT',
      connection: 'close',
      'content-length': '69' });

    nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
      .post('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/0/query', 'where=GlobalID%20%3D%20%2746329a70-e38e-479b-a5d6-be4e65a8880b%27&outFields=%5B%2A%5D&returnIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&f=json&token=qfWf8J78JHsQ3caTXiSC5XwYqvLG3ROidvqoo5CF0mYxLBSf-amssZSsiUfMW8-nIfs6dxohb7_3CkfBxZl2GHiARguCfEehCAPCQV9u22J1q3yrKqVz9XluZ1adN_5v')
      .reply(200, {'objectIdFieldName':'OBJECTID','globalIdFieldName':'GlobalID','geometryType':'esriGeometryPoint','spatialReference':{'wkid':102100,'latestWkid':3857},'fields':[{'name':'OBJECTID','type':'esriFieldTypeOID','alias':'OBJECTID','sqlType':'sqlTypeOther','domain':null,'defaultValue':null},{'name':'TITULO','type':'esriFieldTypeString','alias':'Título','sqlType':'sqlTypeOther','length':250,'domain':null,'defaultValue':null},{'name':'COMENT','type':'esriFieldTypeString','alias':'Comentário','sqlType':'sqlTypeOther','length':600,'domain':null,'defaultValue':null},{'name':'IDUSUA','type':'esriFieldTypeString','alias':'E-mail usuário','sqlType':'sqlTypeOther','length':150,'domain':null,'defaultValue':null},{'name':'DTABER','type':'esriFieldTypeDate','alias':'Data de abertura','sqlType':'sqlTypeOther','length':8,'domain':null,'defaultValue':null},{'name':'DTFECH','type':'esriFieldTypeDate','alias':'Data de fechamento','sqlType':'sqlTypeOther','length':8,'domain':null,'defaultValue':null},{'name':'STATUS','type':'esriFieldTypeSmallInteger','alias':'Status','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'STO','codedValues':[{'name':'Aberta','code':0},{'name':'Em Andamento','code':1},{'name':'Fechada','code':2}]},'defaultValue':null},{'name':'VALID','type':'esriFieldTypeSmallInteger','alias':'Válido','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'VLO','codedValues':[{'name':'Não','code':0},{'name':'Sim','code':1}]},'defaultValue':null},{'name':'ATIVID','type':'esriFieldTypeString','alias':'Atividade','sqlType':'sqlTypeOther','length':600,'domain':null,'defaultValue':null},{'name':'EIXO','type':'esriFieldTypeSmallInteger','alias':'Eixo','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'EIX','codedValues':[{'name':'Água e Saneamento','code':0},{'name':'Conservação Ambiental','code':1},{'name':'Educação','code':2},{'name':'Energia','code':3},{'name':'Governança','code':4},{'name':'Mobilidade','code':5},{'name':'Planejamento Urbano','code':6},{'name':'Poíticas Sociais','code':7},{'name':'Saúde','code':8},{'name':'Segurança','code':9}]},'defaultValue':null},{'name':'URL','type':'esriFieldTypeString','alias':'Link Facebook','sqlType':'sqlTypeOther','length':150,'domain':null,'defaultValue':null},{'name':'UPVOTE','type':'esriFieldTypeInteger','alias':'Votos positivos','sqlType':'sqlTypeOther','domain':null,'defaultValue':null},{'name':'DOWNVO','type':'esriFieldTypeInteger','alias':'Votos negativos','sqlType':'sqlTypeOther','domain':null,'defaultValue':null},{'name':'TPUSUA','type':'esriFieldTypeSmallInteger','alias':'Tipo usuário','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'TPU','codedValues':[{'name':'Cidadão','code':0},{'name':'Servidor','code':1}]},'defaultValue':null},{'name':'GlobalID','type':'esriFieldTypeGlobalID','alias':'GlobalID','sqlType':'sqlTypeOther','length':38,'domain':null,'defaultValue':null},{'name':'PROTOC','type':'esriFieldTypeString','alias':'Protocolo','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'PJPG','type':'esriFieldTypeSmallInteger','alias':'Projeto e programa','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'PEP','codedValues':[{'name':'Não','code':0},{'name':'Sim','code':1}]},'defaultValue':null},{'name':'NMPJPG','type':'esriFieldTypeString','alias':'Nome do projeto e programa','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'PLAGOV','type':'esriFieldTypeSmallInteger','alias':'Plano de governo','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'PDG','codedValues':[{'name':'Não','code':0},{'name':'Sim','code':1}]},'defaultValue':null},{'name':'DPLAGOV','type':'esriFieldTypeString','alias':'Diretriz do plano de governo','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'ACAPRIO','type':'esriFieldTypeSmallInteger','alias':'Ação prioritária','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'ACP','codedValues':[{'name':'Não','code':0},{'name':'Sim','code':1}]},'defaultValue':null},{'name':'TIPOOCR','type':'esriFieldTypeSmallInteger','alias':'Tipo Ocorrência','sqlType':'sqlTypeOther','domain':{'type':'codedValue','name':'TPO','codedValues':[{'name':'Acessibilidade','code':0},{'name':'Água','code':1},{'name':'Árvore','code':2},{'name':'Barulho','code':3},{'name':'Coleta de Lixo','code':4},{'name':'Convservação / Manutenção','code':5},{'name':'Educação','code':6},{'name':'Empresa Irregular','code':7},{'name':'Esgoto','code':8},{'name':'Ilumnicação e Energia','code':9},{'name':'Limpeza Urbana','code':10},{'name':'Obra / Ocupação Irregular','code':11},{'name':'Obra Pública','code':12},{'name':'Pavimentação','code':13},{'name':'Pedestre e Ciclistas','code':14},{'name':'Poda e Capina','code':15},{'name':'Poluição','code':16},{'name':'Queimada','code':17},{'name':'Ruas e Estradas','code':18},{'name':'Saúde','code':19},{'name':'Segurança','code':20},{'name':'Sinalização','code':21},{'name':'Trânsito','code':22},{'name':'Transporte Público','code':23},{'name':'Varrição','code':24}]},'defaultValue':null},{'name':'DEPTO','type':'esriFieldTypeString','alias':'Departamento','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'CARGO','type':'esriFieldTypeString','alias':'Cargo','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'NOME','type':'esriFieldTypeString','alias':'Nome','sqlType':'sqlTypeOther','length':50,'domain':null,'defaultValue':null},{'name':'CARSUS','type':'esriFieldTypeString','alias':'Cartão Sus','sqlType':'sqlTypeOther','length':70,'domain':null,'defaultValue':null},{'name':'CPF','type':'esriFieldTypeString','alias':'CPF','sqlType':'sqlTypeOther','length':15,'domain':null,'defaultValue':null}],'features':[{'attributes':{'OBJECTID':1,'TITULO':'Árvore Tocando a Rede Elétrica','COMENT':'Sem comentários','IDUSUA':'rpepato@img.com.br','DTABER':-2209161600000,'DTFECH':null,'STATUS':1,'VALID':0,'ATIVID':null,'EIXO':1,'URL':null,'UPVOTE':4,'DOWNVO':0,'TPUSUA':1,'GlobalID':'46329a70-e38e-479b-a5d6-be4e65a8880b','PROTOC':null,'PJPG':0,'NMPJPG':null,'PLAGOV':0,'DPLAGOV':null,'ACAPRIO':0,'TIPOOCR':2,'DEPTO':null,'CARGO':null,'NOME':null,'CARSUS':null,'CPF':null},'geometry':{'x':-5107456.158950525,'y':-2655641.8521160996}}]}, { 'content-type': 'text/plain; charset=utf-8',
      etag: '-69365181',
      server: 'Microsoft-IIS/8.5',
      'x-powered-by': 'ASP.NET',
      'access-control-allow-origin': '*',
      date: 'Mon, 28 Dec 2015 17:19:45 GMT',
      connection: 'close',
      'content-length': '6341' });

    nock('https://www.arcgis.com:443', {'encodedQueryParams':true})
      .post('/sharing/rest/oauth2/token/', 'client_id=GJcVOr6llgygZuqJ&client_secret=104e5dc285e04c429d06dd24f91bf5d4&grant_type=client_credentials&expiration=7200')
      .reply(200, {'access_token':'v5ink_C7ZEdLBd3pXG7wvpFoLsx2O0konhgkfdhc9i-h_Eu_M73rBm4nu_kgPjTubEAUyAhMk2ZlzjPKDa2koEtfxUV2vyJtyD08ih4WaMCL91hqi6y56r4PpaDPUtNSKiVzqFQZ9R1lFRBv4pLNGw..','expires_in':7200}, { 'cache-control': 'no-cache, no-store, must-revalidate',
      'content-type': 'text/plain;charset=utf-8',
      date: 'Mon, 28 Dec 2015 17:19:46 GMT',
      expires: '0',
      pragma: 'no-cache',
      server: 'ArcGISOnline',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '1; mode=block',
      'content-length': '188',
      connection: 'Close' });

    nock('http://services6.arcgis.com:80', {'encodedQueryParams':true})
      .post('/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/0/updateFeatures', 'f=json&features=%7B%22attributes%22%3A%7B%22OBJECTID%22%3A1%2C%22TITULO%22%3A%22%C3%81rvore%20Tocando%20a%20Rede%20El%C3%A9trica%22%2C%22COMENT%22%3A%22Sem%20coment%C3%A1rios%22%2C%22IDUSUA%22%3A%22rpepato%40img.com.br%22%2C%22DTABER%22%3A-2209161600000%2C%22DTFECH%22%3Anull%2C%22STATUS%22%3A1%2C%22VALID%22%3A0%2C%22ATIVID%22%3Anull%2C%22EIXO%22%3A1%2C%22URL%22%3Anull%2C%22UPVOTE%22%3A5%2C%22DOWNVO%22%3A0%2C%22TPUSUA%22%3A1%2C%22GlobalID%22%3A%2246329a70-e38e-479b-a5d6-be4e65a8880b%22%2C%22PROTOC%22%3Anull%2C%22PJPG%22%3A0%2C%22NMPJPG%22%3Anull%2C%22PLAGOV%22%3A0%2C%22DPLAGOV%22%3Anull%2C%22ACAPRIO%22%3A0%2C%22TIPOOCR%22%3A2%2C%22DEPTO%22%3Anull%2C%22CARGO%22%3Anull%2C%22NOME%22%3Anull%2C%22CARSUS%22%3Anull%2C%22CPF%22%3Anull%7D%2C%22geometry%22%3A%7B%22x%22%3A-5107456.158950525%2C%22y%22%3A-2655641.8521160996%7D%7D&token=v5ink_C7ZEdLBd3pXG7wvpFoLsx2O0konhgkfdhc9i-h_Eu_M73rBm4nu_kgPjTubEAUyAhMk2ZlzjPKDa2koEtfxUV2vyJtyD08ih4WaMCL91hqi6y56r4PpaDPUtNSKiVzqFQZ9R1lFRBv4pLNGw..')
      .reply(200, {'updateResults':[{'objectId':1,'globalId':'46329a70-e38e-479b-a5d6-be4e65a8880b','success':true}]}, { 'content-type': 'text/plain; charset=utf-8',
      server: 'Microsoft-IIS/8.5',
      'x-powered-by': 'ASP.NET',
      'access-control-allow-origin': '*',
      date: 'Mon, 28 Dec 2015 17:19:48 GMT',
      connection: 'close',
      'content-length': '99' });

    let model = {
      MODULO : 0,
      EMAIL  : 'avidotto@gmail.com',
      ITEM   : '46329a70-e38e-479b-a5d6-be4e65a8880b',
      VOTO   : 1
    };

    return svc.totalize(model).should.be.eventually.deep.equal({
      'data': {
        'updateResults': [
          {
            'globalId': '46329a70-e38e-479b-a5d6-be4e65a8880b',
            'objectId': 1,
            'success': true
          }
        ]
      },
      'result': 'success'
    });
  });
});
