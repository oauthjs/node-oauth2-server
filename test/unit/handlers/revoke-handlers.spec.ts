import * as should from 'should';
import * as sinon from 'sinon';
import { RevokeHandler } from '../../../lib/handlers';
import { Request } from '../../../lib/request';

/**
 * Test `RevokeHandler`.
 */

describe('RevokeHandler', () => {
  describe('handleRevokeToken()', () => {
    it('should call `model.getAccessToken()` and `model.getRefreshToken()`', () => {
      const model = {
        getClient() {},
        revokeToken: sinon.stub().returns(true),
        getRefreshToken: sinon.stub().returns({
          refreshToken: 'hash',
          client: {},
          refreshTokenExpiresAt: new Date(Date.now() * 2),
          user: {},
        }),
        getAccessToken: sinon.stub().returns(false),
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { token: 'foo' },
        headers: {},
        method: {},
        query: {},
      });
      const client = {};

      return handler
        .handleRevokeToken(request, client)
        .then(() => {
          model.getAccessToken.callCount.should.equal(1);
          model.getAccessToken.firstCall.args[0].should.equal('foo');
          model.getRefreshToken.callCount.should.equal(1);
          model.getRefreshToken.firstCall.args[0].should.equal('foo');
        })
        .catch(should.fail);
    });
  });

  describe('getClient()', () => {
    it('should call `model.getClient()`', () => {
      const model = {
        getClient: sinon.stub().returns({ grants: ['password'] }),
        revokeToken() {},
        getRefreshToken() {},
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });

      return handler
        .getClient(request)
        .then(() => {
          model.getClient.callCount.should.equal(1);
          model.getClient.firstCall.args.should.have.length(2);
          model.getClient.firstCall.args[0].should.equal(12345);
          model.getClient.firstCall.args[1].should.equal('secret');
        })
        .catch(should.fail);
    });
  });

  describe('getRefreshToken()', () => {
    it('should call `model.getRefreshToken()`', () => {
      const model = {
        getClient() {},
        revokeToken() {},
        getAccessToken() {},
        getRefreshToken: sinon.stub().returns({
          refreshToken: 'hash',
          client: {},
          refreshTokenExpiresAt: new Date(Date.now() * 2),
          user: {},
        }),
      };
      const handler: any = new RevokeHandler({ model });
      const token = 'hash';
      const client = {};

      return handler
        .getRefreshToken(token, client)
        .then(() => {
          model.getRefreshToken.callCount.should.equal(1);
          model.getRefreshToken.firstCall.args.should.have.length(1);
          model.getRefreshToken.firstCall.args[0].should.equal(token);
        })
        .catch(should.fail);
    });
  });

  describe('revokeToken()', () => {
    it('should call `model.revokeToken()`', () => {
      const model = {
        getClient() {},
        revokeToken: sinon.stub().returns(true),
        getRefreshToken: sinon.stub().returns({
          refreshToken: 'hash',
          client: {},
          refreshTokenExpiresAt: new Date(Date.now() * 2),
          user: {},
        }),
        getAccessToken() {},
      };
      const handler: any = new RevokeHandler({ model });
      const token = 'hash';

      return handler
        .revokeToken(token)
        .then(() => {
          model.revokeToken.callCount.should.equal(1);
          model.revokeToken.firstCall.args.should.have.length(1);
        })
        .catch(should.fail);
    });
  });
});
