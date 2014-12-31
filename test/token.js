/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Token  = require('../lib/token'),
    error = require('../lib/error')
    should = require('should');

describe('Token generator', function() {

  describe('model.generateToken not defined', function() {

    it('Generates random token', function (done) {
      model = {generateToken: null};
      grant = {model: model};
      Token(grant, 'token_type', function (err, token) {
        token.should.not.be.null;
        done();
      });
    });

  });

  describe('model.generateToken is defined', function() {

    it('Returns token from model.generateToken', function (done) {
      var generatedToken = 'generateToken.token';

      var generateToken = function (type, grant, cb) {
        type.should.be.equal('token_type');
        grant.model.should.be.equal(model);
        cb(null, generatedToken)
      };

      model = {generateToken: generateToken};
      grant = {model: model};

      Token(grant, 'token_type', function (err, token) {
        token.should.be.equal(generatedToken);
        done();
      });
    });

    it('Generates random token if model.generateToken does not return a token ', function (done) {
      var generateToken = function (type, grant, cb) {
        cb(null, null)
      };

      model = {generateToken: generateToken};
      grant = {model: model};

      Token(grant, 'token_type', function (err, token) {
        token.should.not.be.null;
        done();
      });
    });

    it('Returns wrapped error from model.generateToken', function (done) {
      var generatedError = new Error('generateToken.error');

      var generateToken = function (type, grant, cb) {
        cb(generatedError)
      };

      model = {generateToken: generateToken};
      grant = {model: model};

      Token(grant, 'token_type', function (err, token) {
        err.should.eql(error('server_error', false, generatedError));
        done();
      });
    });

  });

});