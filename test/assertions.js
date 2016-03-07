'use strict';

/**
 * Module dependencies.
 */

var should = require('should');

/**
 * SHA-1 assertion.
 */

should.Assertion.add('sha1', function() {
  this.params = { operator: 'to be a valid SHA-1 hash' };

  this.obj.should.match(/^[a-f0-9]{40}$/i);
}, true);
