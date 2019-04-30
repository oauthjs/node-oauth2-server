import * as should from 'should';
import * as sinon from 'sinon';
import { ClientCredentialsGrantType } from '../../../lib/grant-types';

/**
 * Test `ClientCredentialsGrantType`.
 */

describe('ClientCredentialsGrantType', () => {
  describe('getUserFromClient()', () => {
    it('should call `model.getUserFromClient()`', async () => {
      const model = {
        getUserFromClient: sinon.stub().returns(true),
        saveToken() {},
      };
      const handler = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const client: any = {};
      try {
        await handler.getUserFromClient(client);
        model.getUserFromClient.callCount.should.equal(1);
        model.getUserFromClient.firstCall.args.should.have.length(1);
        model.getUserFromClient.firstCall.args[0].should.equal(client);
        model.getUserFromClient.firstCall.thisValue.should.equal(model);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });
  });

  describe('saveToken()', () => {
    it('should call `model.saveToken()`', async () => {
      const client: any = {};
      const user = {};
      const model = {
        getUserFromClient() {},
        saveToken: sinon.stub().returns(true),
      };
      const handler = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model,
      });

      sinon.stub(handler, 'validateScope').returns('foobar' as any);
      sinon.stub(handler, 'generateAccessToken').returns('foo' as any);
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz' as any);
      try {
        await handler.saveToken(user, client, 'foobar');
        model.saveToken.callCount.should.equal(1);
        model.saveToken.firstCall.args.should.have.length(3);
        model.saveToken.firstCall.args[0].should.eql({
          accessToken: 'foo',
          accessTokenExpiresAt: 'biz',
          scope: 'foobar',
        });
        model.saveToken.firstCall.args[1].should.equal(client);
        model.saveToken.firstCall.args[2].should.equal(user);
        model.saveToken.firstCall.thisValue.should.equal(model);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });
  });
});
