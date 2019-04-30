import * as sinon from 'sinon';
import {
  AuthenticateHandler,
  AuthorizeHandler,
  TokenHandler,
} from '../../lib/handlers';
import { OAuth2Server as Server } from '../../lib/server';

const Authenticate: any = AuthenticateHandler;
const Authorize: any = AuthorizeHandler;
const Token: any = TokenHandler;
/**
 * Test `Server`.
 */

describe('Server', () => {
  describe('authenticate()', () => {
    it('should call `handle`', async () => {
      const model = {
        getAccessToken() {},
      };
      const server = new Server({ model });

      sinon.stub(Authenticate.prototype, 'handle').returns(Promise.resolve());

      await server.authenticate('foo' as any);

      Authenticate.prototype.handle.callCount.should.equal(1);
      Authenticate.prototype.handle.firstCall.args[0].should.equal('foo');
      Authenticate.prototype.handle.restore();
    });

    it('should map string passed as `options` to `options.scope`', async () => {
      const model = {
        getAccessToken() {},
        verifyScope() {},
      };
      const server = new Server({ model });

      sinon.stub(Authenticate.prototype, 'handle').returns(Promise.resolve());

      await server.authenticate('foo' as any, 'bar' as any, 'test');

      Authenticate.prototype.handle.callCount.should.equal(1);
      Authenticate.prototype.handle.firstCall.args[0].should.equal('foo');
      Authenticate.prototype.handle.firstCall.args[1].should.equal('bar');
      Authenticate.prototype.handle.firstCall.thisValue.should.have.property(
        'scope',
        'test',
      );
      Authenticate.prototype.handle.restore();
    });
  });

  describe('authorize()', () => {
    it('should call `handle`', async () => {
      const model = {
        getAccessToken() {},
        getClient() {},
        saveAuthorizationCode() {},
      };
      const server = new Server({ model });

      sinon.stub(Authorize.prototype, 'handle').returns(Promise.resolve());

      await server.authorize('foo' as any, 'bar' as any);

      Authorize.prototype.handle.callCount.should.equal(1);
      Authorize.prototype.handle.firstCall.args[0].should.equal('foo');
      Authorize.prototype.handle.restore();
    });
  });

  describe('token()', () => {
    it('should call `handle`', async () => {
      const model = {
        getClient() {},
        saveToken() {},
      };
      const server = new Server({ model });

      sinon.stub(Token.prototype, 'handle').returns(Promise.resolve());

      await server.token('foo' as any, 'bar' as any);

      Token.prototype.handle.callCount.should.equal(1);
      Token.prototype.handle.firstCall.args[0].should.equal('foo');
      Token.prototype.handle.restore();
    });
  });
});
