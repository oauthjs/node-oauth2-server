'use strict';

/**
 * Module dependencies.
 */

var chai = require('chai');

/**
 * SHA-256 assertion.
 */

chai.use(function (_chai, utils) {
  chai.Assertion.addMethod('sha256', function (...args) {
    var obj = utils.flag(this, 'object');
    new chai.Assertion(obj).match(/^[a-f0-9]{64}$/i);
  });
});
