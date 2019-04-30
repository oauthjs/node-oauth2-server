import * as should from 'should';
import * as sinon from 'sinon';
import { PasswordGrantType } from '../../../lib/grant-types';
import { Request } from '../../../lib/request';

/**
 * Test `PasswordGrantType`.
 */

describe('PasswordGrantType', () => {
  describe('getUser()', () => {
    it('should call `model.getUser()`', async () => {
      const model = {
        getUser: sinon.stub().returns(true),
        saveToken() {},
      };
      const handler = new PasswordGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {},
      });
      try {
        await handler.getUser(request);
        model.getUser.callCount.should.equal(1);
        model.getUser.firstCall.args.should.have.length(2);
        model.getUser.firstCall.args[0].should.equal('foo');
        model.getUser.firstCall.args[1].should.equal('bar');
        model.getUser.firstCall.thisValue.should.equal(model);
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
        getUser() {},
        saveToken: sinon.stub().returns(true),
      };
      const handler = new PasswordGrantType({
        accessTokenLifetime: 120,
        model,
      });

      sinon.stub(handler, 'validateScope').returns('foobar' as any);
      sinon.stub(handler, 'generateAccessToken').returns('foo' as any);
      sinon.stub(handler, 'generateRefreshToken').returns('bar' as any);
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz' as any);
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz' as any);
      try {
        await handler.saveToken(user, client, 'foobar');

        model.saveToken.callCount.should.equal(1);
        model.saveToken.firstCall.args.should.have.length(3);
        model.saveToken.firstCall.args[0].should.eql({
          accessToken: 'foo',
          accessTokenExpiresAt: 'biz',
          refreshToken: 'bar',
          refreshTokenExpiresAt: 'baz',
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
