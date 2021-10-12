var TokenModel = require('../../../lib/models/token-model');
var should = require('chai').should();
/**
 * Test `Server`.
 */

describe('Model', function() {
  describe('constructor()', function() {
    it('should calculate `accessTokenLifetime` if `accessTokenExpiresAt` is set', function() {
      var atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);
  
      var data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };
  
      var model = new TokenModel(data);
      should.exist(model.accessTokenLifetime);
      model.accessTokenLifetime.should.a('number');
      model.accessTokenLifetime.should.be.approximately(3600, 2);
    });
  });
});
