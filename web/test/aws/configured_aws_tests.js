'use strict';
require('../helper');
const
  chai = require('chai'),
  expect = chai.expect,
  Amazon = require('../../src/modules/aws/configured_aws');

describe('when creating a configured aws instance', function() {
  describe('in parameterless mode', function() {
    it('should use environment variables', function() {
      let
        aws = new Amazon();
      expect(aws).to.be.an('object');
      expect(aws.root().config.apiVersion).to.equal('latest');
      expect(aws.root().config.accessKeyId).to.equal(process.env.AWS_KEY);
      expect(aws.root().config.secretAccessKey).to.equal(process.env.AWS_SECRET);
      expect(aws.root().config.region).to.equal(process.env.AWS_REGION);
    });
  });
});
