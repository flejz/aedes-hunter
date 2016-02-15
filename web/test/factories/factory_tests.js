'use strict';
require('../helper');
const
  chai = require('chai'),
  expect = chai.expect,
  wagner = require('wagner-core');

describe('with registered factories', function() {

  it ('an aws module should be available', function() {
    wagner.invoke(function(aws) {
      expect(aws).to.be.an('object');
    });
  });

  it ('a tokenManager module should be available', function() {
    wagner.invoke(function(tokenManager) {
      expect(tokenManager).to.be.an('object');
    });
  });

});
