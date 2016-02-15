'use strict';
require('../helper');
const
  assert        = require('assert'),
  nock          = require('nock'),
  util          = require('util'),
  Uploader      = require('../../src/modules/data_upload/upload_queue');

describe('if service is private, when I send new features', function() {

  const
    baseUrl        = 'http://services6.arcgis.com',
    path           = '/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/0',
    actionName     = '/addFeatures',
    actionPath     = util.format('%s%s', path, actionName),
    feature        = '[{"attributes":{"NAME":"VIDOTTO","CITYID":4,"INFO":"ALEX"},"geometry":{"x":-5208344.556299999,"y":-2702210.918299999}}]',
    feature2       = '[{"attributes":{"NAME":"V1DOTTO","CITYID":6,"INFO":"AL3X"},"geometry":{"x":-5208344.556299999,"y":-2702210.918299999}}]',
    success_resp   = {'addResults':[{'objectId':11,'globalId':'3631CDF5-6F21-41FE-A1AD-8E657401767E','success':true}]},
    success_resp2  = {'addResults':[{'objectId':12,'globalId':'3631CDF5-6F21-41FE-A1AD-8E657401767E','success':true}]};

  describe('with the body well formed', function () {
    describe('if I sending just one batch', function (){
      it('the feature must be inserted with success', function () {
        let
          actionUrl = util.format('%s%s', baseUrl, actionPath),
          batch     = [ feature ],
          uploader  = new Uploader(actionUrl, batch, { token: 'VALID_TOKEN' });

        nock(baseUrl)
          .post(actionPath,
            'f=json&token=VALID_TOKEN&rollbackOnFailure=true&features=%5B%7B%22attributes%22%3A%7B%22NAME%22%3A%22VIDOTTO%22%2C%22CITYID%22%3A4%2C%22INFO%22%3A%22ALEX%22%7D%2C%22geometry%22%3A%7B%22x%22%3A-5208344.556299999%2C%22y%22%3A-2702210.918299999%7D%7D%5D')
          .reply(200, success_resp);

        return uploader.send()
         .then(function (response) {
           assert.equal(
            JSON.stringify(response),
            JSON.stringify({ result: 'success', results: [ success_resp ], errors: []})
          );
         })
         .catch(function (error) {
           throw error;
         });
      });
    });

    describe('if I sending more the one batch', function () {
      it('the features must be inserted with success', function () {

        let
          actionUrl = util.format('%s%s', baseUrl, actionPath),
          batch     = [ feature, feature2 ],
          uploader  = new Uploader(actionUrl, batch, { token: 'VALID_TOKEN' });

        nock(baseUrl)
           .post(actionPath,
              'f=json&token=VALID_TOKEN&rollbackOnFailure=true&features=%5B%7B%22attributes%22%3A%7B%22NAME%22%3A%22VIDOTTO%22%2C%22CITYID%22%3A4%2C%22INFO%22%3A%22ALEX%22%7D%2C%22geometry%22%3A%7B%22x%22%3A-5208344.556299999%2C%22y%22%3A-2702210.918299999%7D%7D%5D')
          .reply(200, success_resp);

        nock(baseUrl)
          .post(actionPath,
              'f=json&token=VALID_TOKEN&rollbackOnFailure=true&features=%5B%7B%22attributes%22%3A%7B%22NAME%22%3A%22V1DOTTO%22%2C%22CITYID%22%3A6%2C%22INFO%22%3A%22AL3X%22%7D%2C%22geometry%22%3A%7B%22x%22%3A-5208344.556299999%2C%22y%22%3A-2702210.918299999%7D%7D%5D')
          .reply(200, success_resp2);

        return uploader.send()
          .then(function (response) {
            assert.equal(
              JSON.stringify(response),
              JSON.stringify({ result: 'success', results: [ success_resp, success_resp2 ], errors: []})
            );
          })
          .catch(function (error) {
            throw error;
          });
      });
    });
    describe('if any feature fail on insert or update', function () {
      it('the process must be stoped and an error should be reported', function (){

        let
          actionUrl    = util.format('%s%s', baseUrl, actionPath),
          withErrors   = '[{"attributes":{"NAME":"VIDOTTO","CITYID":4,"INFO":"ALEX"},"geometry":{"x":-5208344.556299999,"y":-2702210.918299999}},{"attributes":{},"geometry":{"x":-5208344.556299999,"y":-2702210.918299999}}]',
          batch        = [ withErrors, feature ],
          uploader     = new Uploader(actionUrl, batch, { token: 'VALID_TOKEN' });

        nock(baseUrl)
          .post(actionPath,
              'f=json&token=VALID_TOKEN&rollbackOnFailure=true&features=%5B%7B%22attributes%22%3A%7B%22NAME%22%3A%22VIDOTTO%22%2C%22CITYID%22%3A4%2C%22INFO%22%3A%22ALEX%22%7D%2C%22geometry%22%3A%7B%22x%22%3A-5208344.556299999%2C%22y%22%3A-2702210.918299999%7D%7D%2C%7B%22attributes%22%3A%7B%7D%2C%22geometry%22%3A%7B%22x%22%3A-5208344.556299999%2C%22y%22%3A-2702210.918299999%7D%7D%5D')
          .reply(200, {
            'addResults': [
              {
                'objectId': 60,
                'globalId': 'DED98E66-3681-4BCE-98E6-F7BBEAE3613F',
                'success': false,
                'error': {
                  'code': 1003,
                  'description': 'Operation rolled back.'
                }
              },
              {
                'objectId': null,
                'globalId': '6C8B6CF5-E67B-4DB6-A03D-6EC185C76141',
                'success': false,
                'error': {
                  'code': 1000,
                  'description': 'Cannot insert the value NULL into column \'NAME\', table \'db_12693.user_12693.agroUT_POI\'; column does not allow nulls. INSERT fails.\r\nThe statement has been terminated.'
                }
              }
            ]
          });

        return uploader.send()
          .then(function (response) {
            console.log('ERROR', response);
          })
          .catch(function (errorinfo) {
             // TODO(alex): verify why errors[1] is a [object String].
            let results = JSON.parse(errorinfo.errors[1])['addResults'];
             // index 0 roolback
            assert.equal(results[0].error.code, 1003 /* roolback code */);
             // index 1 caused the error
            assert.equal(results[1].error.code, 1000 /* Cannot insert the value NULL into column 'NAME' */);
          });
      });
    });
  });
});
