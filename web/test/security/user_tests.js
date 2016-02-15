'use strict';
require('../helper');
const
  user            = require('../../src/modules/security/user'),
  nock            = require('nock'),
  fs              = require('fs'),
  validUser       = fs.readFileSync(__dirname + '/../../fixtures/security/valid_user.json').toString();

describe('when logging via social networks ', function() {
  describe('with an already registered e-mail', function() {

    it ('the log in should be successfull', function() {
      nock('https://dynamodb.us-east-1.amazonaws.com')
        .filteringRequestBody(function() {
          return '*';
        })
        .post('/')
        .reply(200, validUser);

      let expectedResult = {
        result: 'success',
        data: {
          nome: 'Foo Bar'
        }
      };

      return user.logon('foo@bar.com', null, {provider: 'facebook'}).should
        .eventually.deep.equal(expectedResult);
    });
  });

  describe('with an not registered e-mail', function() {

    it ('the user should be registered and the login should be successfull', function() {

      nock('https://dynamodb.us-east-1.amazonaws.com:443', {'encodedQueryParams':true})
        .post('/', {'TableName':'Users','KeyConditionExpression':'#mail = :email','ExpressionAttributeNames':{'#mail':'email','#provider':'provider'},'FilterExpression':'attribute_exists(#provider)','ExpressionAttributeValues':{':email':{'S':'new@email.com'}}})
        .reply(200, {'Count':0,'Items':[],'ScannedCount':0});

      nock('https://dynamodb.us-east-1.amazonaws.com:443', {'encodedQueryParams':true})
        .post('/', {'TableName':'Users','KeyConditionExpression':'#mail = :email','ExpressionAttributeNames':{'#mail':'email'},'ExpressionAttributeValues':{':email':{'S':'new@email.com'}}})
        .reply(200, {'Count':0,'Items':[],'ScannedCount':0});

      nock('https://dynamodb.us-east-1.amazonaws.com:443', {'encodedQueryParams':true})
        .post('/', {'TableName':'Users','Item':{'provider':{'S':'facebook'},'nome':{'S':'New User'},'email':{'S':'new@email.com'}}})
        .reply(200, {});

      return user.logon('new@email.com', null, {provider: 'facebook', nome: 'New User'}).should.eventually.
        deep.equal({
          result: 'success',
          data: {
            nome: 'New User'
          }
        });
    });
  });
});
