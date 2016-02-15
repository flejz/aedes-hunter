'use strict';
require('../helper');
const
  assert         = require('assert'),
  nock           = require('nock'),
  fs             = require('fs'),
  handler        = require('../../src/modules/data_upload/upload_handler'),
  _              = require('lodash');

const
  rawData        = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/dataupload_testParsers.json').toString()),
  rawDataInsert  = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/dataupload_testInsert.json').toString()),
  rawDataUpdate  = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/dataupload_testUpdate.json').toString());

describe('When I execute the process', function(){
  describe('and the operationType is Insert', function () {
    it('the handler must send to uploader all values in rawData', function () {
      let
        features = handler._parse(rawData);

      return handler._fetch(features, rawData)
                    .then(function (response) {
                      assert.equal(response, features);
                    })
                    .catch(function (err){
                      throw Error(err);
                    });
    });

    it('the uploader must successfully insert the features', function () {
      let
        expresp = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/addfeatures_resp.json').toString());

      nock('http://services6.arcgis.com:80')
        .post(
          '/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/0/addFeatures',
          'f=json&token=VALID_TOKEN&rollbackOnFailure=true&features=%5B%7B%22attributes%22%3A%7B%22INFO%22%3A%22VIDOTTO%22%2C%22CITYID%22%3A99%2C%22NAME%22%3A%22ALEX%22%7D%2C%22geometry%22%3A%7B%22x%22%3A1%2C%22y%22%3A0%7D%7D%2C%7B%22attributes%22%3A%7B%22INFO%22%3A%22ALEX%22%2C%22CITYID%22%3A100%2C%22NAME%22%3A%22VIDOTTO%22%7D%2C%22geometry%22%3A%7B%22x%22%3A1%2C%22y%22%3A0%7D%7D%5D')
        .reply(200, expresp);

      return handler.upload(rawDataInsert)
                    .then(function (response) {
                      assert.equal(
                        JSON.stringify(response),
                        JSON.stringify({ result: 'success', results: [ expresp ], errors: [] })
                      );
                    })
                    .catch(function(err) {
                      throw err;
                    });
    });
  });
  describe('and the operationType is Update', function () {
    let
      expresp = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/queryall_resp.json').toString()),
      hashMap = {},
      validateFeatures = function (features, uptOID) {
        let flag = {};
        return _.filter(features, function (feature){
          if(feature.attributes.CITYID in flag) {
            // remove duplicated values
            return false;
          }
          flag[feature.attributes.CITYID] = 1;
          if(uptOID){
            // sumulate the objectid that be updated.
            feature.attributes.OBJECTID = 'OLDER';
          }
          return true;
        });
      };

    it('all items must be request', function () {

      let
        queryforupdate_resp = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/queryforupdate_resp.json').toString());

      nock('http://services6.arcgis.com:80')
        .get('/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/0/query',
             'f=json&returnGeometry=false&outFields=OBJECTID%2CCITYID&where=CITYID%20IN%2810%2C9%29&token=VALID_TOKEN')
        .reply(200, queryforupdate_resp);

      return handler._getForUpdate(handler._parse(rawDataUpdate), {
        primaryKey: 'CITYID',
        serviceUrl:'http://services6.arcgis.com/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/0/',
        token: 'VALID_TOKEN'
      })
      .then(function (response) {
        assert.equal(
          JSON.stringify(response),
          JSON.stringify(queryforupdate_resp)
        );
      })
      .catch(function (err) {
        throw Error(err);
      });
    });
    describe('an error should be reported if', function () {
      it('the primaryKey informed contains duplicated values', function () {
        let exception = null;
        try {
          handler._getHashMap(expresp.features, 'CITYID');
        } catch (e) {
          exception = e;
        }
        assert.equal(exception.message, 'CITYID (3) is not a primary key. Duplicated values was found.');
      });
    });
    it('the handler must extract successfully the hash object { primarykey:objectid } from features', function () {
      let validFeatures = validateFeatures(expresp.features);
      hashMap = handler._getHashMap(validFeatures, 'CITYID');
      _.forEach(expresp.features, function(feature){
        assert(feature.attributes.CITYID in hashMap);
      });
    });
    it('features to upload must be updated with your real ObjectID', function () {
      let
        featWithOlderOID = validateFeatures(expresp.features, true),
        featToCompare    = validateFeatures(expresp.features),
        featToUpdate     = handler._setObjectIds(featWithOlderOID, hashMap);

      assert.equal(
        JSON.stringify(featToCompare),
        JSON.stringify(featToUpdate)
      );
    });
    it('the uploader must successfully update the features', function () {
      let
        expresp             = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/updateFeatures_resp.json').toString()),
        queryforupdate_resp = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/uploader/queryforupdate_resp.json').toString());

      // query all
      nock('http://services6.arcgis.com:80')
        .get('/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/0/query',
             'f=json&returnGeometry=false&outFields=OBJECTID%2CCITYID&where=CITYID%20IN%2810%2C9%29&token=48-b-2CCPBRGML1sL1O1fypoLewJ0OkIHN0HYCKkfvkxiFGQcFatGwXcokKFLDdk6wYLuoPJs_-s9hcChrm-_4XC-FG7ZVZcoMcFTuR_dk3QO51WEjx3EoGkhdSfhpyVfmK6XJYrgeOmqiLS_ln6eg..')
        .reply(200, queryforupdate_resp);

      // update
      nock('http://services6.arcgis.com')
        .post(
          '/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/0/updateFeatures',
          'f=json&token=48-b-2CCPBRGML1sL1O1fypoLewJ0OkIHN0HYCKkfvkxiFGQcFatGwXcokKFLDdk6wYLuoPJs_-s9hcChrm-_4XC-FG7ZVZcoMcFTuR_dk3QO51WEjx3EoGkhdSfhpyVfmK6XJYrgeOmqiLS_ln6eg..&rollbackOnFailure=true&features=%5B%7B%22attributes%22%3A%7B%22INFO%22%3A%22VIDOTTO%22%2C%22CITYID%22%3A10%2C%22NAME%22%3A%22AUTO%22%2C%22OBJECTID%22%3A9%7D%2C%22geometry%22%3A%7B%22x%22%3A1%2C%22y%22%3A0%7D%7D%2C%7B%22attributes%22%3A%7B%22INFO%22%3A%22AUTO%22%2C%22CITYID%22%3A9%2C%22NAME%22%3A%22VIDOTTO%22%2C%22OBJECTID%22%3A8%7D%2C%22geometry%22%3A%7B%22x%22%3A1%2C%22y%22%3A0%7D%7D%5D')
        .reply(200, expresp);

      return handler.upload(rawDataUpdate)
                    .then(function (response) {
                      assert.equal(
                        JSON.stringify({ result: 'success', results: [ expresp ], errors: [] }),
                        JSON.stringify(response)
                      );
                    })
                    .catch(function (err) {
                      throw err;
                    });
    });
  });
  describe('with feature which contains relationship', function () {
    describe.skip('an error should be reported if', function () {
      it.skip('there is no parent to any ID', function () {
        throw Error('NotImplementedException.');
      });
    });
  });
  describe('an error should be reported if', function () {
    function _assert(data, expectedMsg, opts) {
      let exception = null;
      try {
        handler._shallowAnalysis(data, opts || { serviceUrl: '', token: ''  });
      } catch (e) {
        exception = e;
      }
      assert(exception.message == expectedMsg);
    }
    it('are missing required properties', function() {
      let data = JSON.parse(JSON.stringify(rawData));
      delete data.primaryKey;
      _assert(data, 'primaryKey not found in data. Required: values, headers, ignoreFields, primaryKey, serviceUrl');
    });
    it('headers is empty', function () {
      let data = JSON.parse(JSON.stringify(rawData));
      data.headers = [];
      _assert(data, 'data.headers is empty');
    });
    it('values is empty', function () {
      let data = JSON.parse(JSON.stringify(rawData));
      data.values = [];
      _assert(data, 'data.values is empty');
    });
    it('values.length is different than headers.length', function () {
      let data = JSON.parse(JSON.stringify(rawData));
      data.values[5].pop();
      _assert(data, 'data.values[5] has invalid length');
    });
  });
});

describe('When I split data in batches', function() {
  describe('and have no BATCH_SIZE_UPLOAD', function() {
    it('must be created a unique batch', function() {
      let items = handler._parse(rawData);
      let batches = handler._splitInBatches(items, rawData.values.length);
      assert(batches.length == 1);
    });
  });
  describe('and have BATCH_SIZE_UPLOAD = 3', function() {
    it('must be created four batches', function() {
      let items = handler._parse(rawData);
      let batches = handler._splitInBatches(items, 3);
      assert(batches.length == 4);
    });
  });
});

describe('When I build feature item', function(){
  describe('the feature must have', function () {
    it('all attributes in data.headers', function(){
      let
        info  = handler._getAttributesInfo(rawData.headers),
        attrs = Object.keys(info.attrs);

      for (let i = 0, len = rawData.headers.length; i < len; i++) {
        if (info.shpIndex && i == info.shpIndex) {
          // continue for field SHAPE
          continue;
        }
        assert(~rawData.headers.indexOf(attrs[i]));
      }
    });
    it('all attributes filled by your index column value', function(){
      let
        attrInfo = handler._getAttributesInfo(rawData.headers),
        items = handler._fillAttributes(attrInfo, rawData.values);

      for (let y = 0, item; item = items[y]; y++) {
        for (var attr in attrInfo.info) {
          assert.equal(rawData.values[y][attrInfo.info[attr]], item.attributes[attr]);
        }
      }
    });
  });
  describe('and has ignoreFields', function() {
    rawData.ignoreFields.push('p2', 'p4', 'p6', 'p8');

    let
      attrInfo = handler._getAttributesInfo(rawData.headers, rawData.ignoreFields),
      items = handler._fillAttributes(attrInfo, rawData.values),
      qttIgn = rawData.ignoreFields.length;
      
    it('the attributes must not contain these fields', function () {
      assert(Object.keys(attrInfo.attrs).length == (rawData.headers.length - 1 /* remove SHAPE */) - qttIgn);
      for (var i in rawData.ignoreFields) {
        assert(!(rawData.ignoreFields[i] in attrInfo.attrs));
      }
    });
    it('each attribute must be filled by your index column value', function () {
      for (let y = 0, item; item = items[y]; y++) {
        for (var attr in attrInfo.info) {
          assert.equal(rawData.values[y][attrInfo.info[attr]], item.attributes[attr]);
        }
      }
    });
  });
});
