'use strict';

/**
 * Module dependencies.
 */

var chai = require('chai');

/**
 * SHA-1 assertion.
 */
chai.use(function (_chai, utils) {

  utils.addMethod(chai.Assertion.prototype, 'sha1', function () {
    var obj = utils.flag(this, 'object');
    new chai.Assertion(obj).match(/^[a-f0-9]{40}$/i);
  });
  
});
