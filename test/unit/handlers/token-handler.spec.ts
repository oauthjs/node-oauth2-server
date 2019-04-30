import * as should from 'should';
import * as sinon from 'sinon';
import { TokenHandler } from '../../../lib/handlers';
import { Request } from '../../../lib/request';

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', () => {
  describe('getClient()', () => {
    it('should call `model.getClient()`', () => {
      const model = {
        getClient: sinon
          .stub()
          .returns(Promise.resolve({ grants: ['password'] })),
        saveToken() {},
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model,
        refreshTokenLifetime: 120,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request, {})
        .then(() => {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(2);
          model.getClient.firstCall.args[0].should.equal(12345);
          model.getClient.firstCall.args[1].should.equal('secret');
          model.getClient.firstCall.thisValue.should.equal(model);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });
  });
});
