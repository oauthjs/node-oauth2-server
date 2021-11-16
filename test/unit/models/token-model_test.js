const TokenModel = require('../../../lib/models/token-model');
const should = require('chai').should();
/**
 * Test `Server`.
 */

describe('Model', function() {
  describe('constructor()', function() {
    it('should calculate `accessTokenLifetime` if `accessTokenExpiresAt` is set', function() {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);
  
      const data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };
  
      const model = new TokenModel(data);
      should.exist(model.accessTokenLifetime);
      model.accessTokenLifetime.should.a('number');
      model.accessTokenLifetime.should.be.approximately(3600, 2);
    });
  });
});
