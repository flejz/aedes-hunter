'use strict';
require('../helper');
const
  chai = require('chai'),
  expect = chai.expect,
  hash = require('../../src/modules/helpers/hash');

describe('when combining', function() {
  describe('two empty objects', function() {
    it ('should return an empty object', function() {
      expect(hash.merge({}, {})).to.deep.equal({});
    });
  });

  describe('other data types', function() {
    it ('should raise an error', function() {
      expect(function() { hash.merge(undefined, 3); }).to.throw(Error);
    });
  });

  describe ('two valid objects', function() {
    it ('should not override the value on the first object', function() {
      expect(hash.merge({ firstValue: '1' }, { firstValue: '2' })).to.deep.equal({ firstValue: '1'});
    });

    it ('should add attributes to first object', function() {
      expect(hash.merge({ a: true }, { b: false})).to.deep.equal({a: true, b: false});
    });
  });
});
