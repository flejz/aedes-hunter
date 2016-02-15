'use strict';
require('../helper');
const
  fs = require('fs'),
  extractor = require('../../src/modules/data_extract/extractor');

describe('when extracting json data', function() {

  describe('the promise should be rejected if', function() {
    it ('the zipfile misses the ".shp" file', function() {
      let
        pathNoShp = __dirname + '/data/estados-no-shp.zip';

      return extractor.fromFile(pathNoShp).should.be.rejected;
    });

    it ('the zipfile misses the ".dbf" file', function() {
      let pathNoDbf = __dirname + '/data/estados-no-dbf.zip';

      return extractor.fromFile(pathNoDbf).should.be.rejected;
    });
  });

  describe('from a valid file path', function() {
    it ('the promise should be fullfiled even when .prj file is missing', function() {
      let
        pathNoPrj = __dirname + '/data/estados-no-prj.zip',
        uploadResponseNoPrj = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/extractor/upload-response-no-prj.json').toString()),
        uploadResponseNoPrjReturn = '<textarea>' + JSON.stringify(uploadResponseNoPrj) + '</textarea>';

      return extractor.fromFile(pathNoPrj).should.eventually.deep.equal(uploadResponseNoPrjReturn);
    });

    it('a proper json object must be returned', function() {
      let
        uploadResponse = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/extractor/upload-response.json').toString()),
        uploadResponseReturn = '<textarea>' + JSON.stringify(uploadResponse) + '</textarea>',
        path = __dirname + '/data/estados.zip',
        buffer = fs.readFileSync(path);

      return extractor.fromBuffer(buffer, path).should.eventually.equal(uploadResponseReturn);
    });
  });

  describe('from an invalid file path', function() {
    it ('the promise should be rejected', function() {
      let
        fakePath = './data/fake.zip';

      return extractor.fromFile(fakePath).should.be.rejected;
    });
  });
});

// TODO: fix the fixture so this test can pass
describe.skip('when uploading the file', function() {
  it ('the data should be extracted and returned as json', function() {

    let
      formattedFeatures = JSON.parse(fs.readFileSync(__dirname + '/../../fixtures/extractor/formatted-features.json').toString()),
      path = '../../../../web_app/uploads/1adbc9df0dcdd61eadb595e51d38dc3f';

    return extractor.confirmFromFile(path).should.eventually.equal(formattedFeatures);
  });
});
