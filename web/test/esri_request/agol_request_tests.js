'use strict';
require('../helper');
const
  fs                    = require('fs'),
  util                  = require('util'),
  nock                  = require('nock'),
  cityServiceDescriptor = JSON.stringify(fs.readFileSync(__dirname + '/../../fixtures/esri_request/city_service_descriptor.json').toString()),
  AgolRequest           = require('../../src/modules/esri_request/agol_request');

describe('when requesting data from a secured service', function() {

  it ('the request should succeed', function() {
    let
      accessToken = 'validToken',
      queryString = {'f': 'pjson'},
      baseUrl     = 'http://services6.arcgis.com',
      action      = '/um4RQnU40VyzFeR6/arcgis/rest/services/agroUT/FeatureServer/1';

    nock.cleanAll();

    nock('https://www.arcgis.com/sharing/rest/oauth2/token')
      .post('/', 'client_id=validAppId&client_secret=validAppSecret&grant_type=client_credentials&expiration=7200')
      .reply(200, { access_token: accessToken,
                    expires_in: 300 });

    queryString['token'] = accessToken;

    nock(baseUrl)
      .get(action)
      .query(queryString)
      .reply(200, cityServiceDescriptor);

    let
      request = new AgolRequest('validAppId', 'validAppSecret'),
      url     = util.format('%s%s?f=pjson', baseUrl, action);

    return request.get(url).should.eventually.deep.equal(JSON.parse(cityServiceDescriptor));
  });

});
