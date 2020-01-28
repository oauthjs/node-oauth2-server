import * as should from 'should';
import * as sinon from 'sinon';
import { ImplicitGrantType } from '../../../lib/grant-types';
/**
 * Test `ImplicitGrantType`.
 */

describe('ImplicitGrantType', () => {
  describe('saveToken()', () => {
    it('should call `model.saveToken()`', () => {
      const client = {};
      const user = {};
      const model = {
        saveToken: sinon.stub().returns(true),
      };
      const handler: any = new ImplicitGrantType({
        accessTokenLifetime: 120,
        model,
        user,
      });

      sinon.stub(handler, 'validateScope').returns('foobar-scope');
      sinon
        .stub(handler, 'generateAccessToken')
        .returns(Promise.resolve('foobar-token'));
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('foo-1234');

      return handler
        .saveToken(user, client, 'foobar')
        .then(() => {
          model.saveToken.callCount.should.equal(1);
          model.saveToken.firstCall.args.should.have.length(3);
          model.saveToken.firstCall.args[0].should.eql({
            accessToken: 'foobar-token',
            accessTokenExpiresAt: 'foo-1234',
            scope: 'foobar-scope',
          });
          model.saveToken.firstCall.args[1].should.equal(client);
          model.saveToken.firstCall.args[2].should.equal(user);
          model.saveToken.firstCall.thisValue.should.equal(model);
        })
        .catch(should.fail);
    });
  });
});
