import * as should from 'should';
import * as TokenUtil from '../../../lib/utils/token-util';

/**
 * Test `TokenUtil` integration.
 */

describe('TokenUtil integration', () => {
  describe('generateRandomToken()', () => {
    it('should return a sha-1 token', async () => {
      try {
        const token: any = await TokenUtil.GenerateRandomToken();
        token.should.be.a.sha1();
      } catch (error) {
        should.fail('should.fail', '');
      }
    });
  });
});
