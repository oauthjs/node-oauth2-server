import * as should from 'should';
import * as sinon from 'sinon';
import { AuthorizationCodeGrantType } from '../../../lib/grant-types';
import { Request } from '../../../lib/request';

/**
 * Test `AuthorizationCodeGrantType`.
 */

describe('AuthorizationCodeGrantType', () => {
  describe('getAuthorizationCode()', () => {
    it('should call `model.getAuthorizationCode()`', async () => {
      const model = {
        getAuthorizationCode: sinon.stub().returns({
          authorizationCode: 12345,
          client: {},
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
        }),
        revokeAuthorizationCode() {},
        saveToken() {},
      };
      const handler = new AuthorizationCodeGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {},
      });
      const client: any = {};
      try {
        await handler.getAuthorizationCode(request, client);

        model.getAuthorizationCode.callCount.should.equal(1);
        model.getAuthorizationCode.firstCall.args.should.have.length(1);
        model.getAuthorizationCode.firstCall.args[0].should.equal(12345);
        model.getAuthorizationCode.firstCall.thisValue.should.equal(model);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });
  });

  describe('revokeAuthorizationCode()', () => {
    it('should call `model.revokeAuthorizationCode()`', async () => {
      const model = {
        getAuthorizationCode() {},
        revokeAuthorizationCode: sinon.stub().returns(true),
        saveToken() {},
      };
      const handler = new AuthorizationCodeGrantType({
        accessTokenLifetime: 120,
        model,
      });
      const authorizationCode: any = {};
      try {
        await handler.revokeAuthorizationCode(authorizationCode);

        model.revokeAuthorizationCode.callCount.should.equal(1);
        model.revokeAuthorizationCode.firstCall.args.should.have.length(1);
        model.revokeAuthorizationCode.firstCall.args[0].should.equal(
          authorizationCode,
        );
        model.revokeAuthorizationCode.firstCall.thisValue.should.equal(model);
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
        getAuthorizationCode() {},
        revokeAuthorizationCode() {},
        saveToken: sinon.stub().returns(true),
      };
      const handler = new AuthorizationCodeGrantType({
        accessTokenLifetime: 120,
        model,
      });

      sinon.stub(handler, 'validateScope').returns('foobiz' as any);
      sinon
        .stub(handler, 'generateAccessToken')
        .returns(Promise.resolve('foo'));
      sinon
        .stub(handler, 'generateRefreshToken')
        .returns(Promise.resolve('bar'));
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz' as any);
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz' as any);
      try {
        await handler.saveToken(user, client, 'foobar', 'foobiz');
        model.saveToken.callCount.should.equal(1);
        model.saveToken.firstCall.args.should.have.length(3);
        model.saveToken.firstCall.args[0].should.eql({
          accessToken: 'foo',
          authorizationCode: 'foobar',
          accessTokenExpiresAt: 'biz',
          refreshToken: 'bar',
          refreshTokenExpiresAt: 'baz',
          scope: 'foobiz',
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
