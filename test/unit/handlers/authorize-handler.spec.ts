import * as should from 'should';
import * as sinon from 'sinon';
import { AuthorizeHandler } from '../../../lib/handlers';
import { Request } from '../../../lib/request';
import { Response } from '../../../lib/response';

/**
 * Test `AuthorizeHandler`.
 */

describe('AuthorizeHandler', () => {
  // describe('generateAuthorizationCode()', () => {
  //   it('should call `model.generateAuthorizationCode()`', async () => {
  //     const model = {
  //       generateAuthorizationCode: sinon.stub().returns({}),
  //       getAccessToken() {},
  //       getClient() {},
  //       saveAuthorizationCode() {},
  //     };
  //     const handler = new AuthorizeHandler({
  //       authorizationCodeLifetime: 120,
  //       model,
  //     });
  //     try {
  //       await handler.generateAuthorizationCode({}, {}, {});
  //       model.generateAuthorizationCode.callCount.should.equal(1);
  //       model.generateAuthorizationCode.firstCall.thisValue.should.equal(model);
  //     } catch (error) {
  //       should.fail('should.fail', '');
  //     }
  //   });
  // });

  describe('getClient()', () => {
    it('should call `model.getClient()`', async () => {
      const model = {
        getAccessToken() {},
        getClient: sinon.stub().returns(
          Promise.resolve({
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb'],
          }),
        ),
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {},
      });
      try {
        await handler.getClient(request);
        model.getClient.callCount.should.equal(1);
        model.getClient.firstCall.args.should.have.length(1);
        model.getClient.firstCall.args[0].should.equal(12345);
        model.getClient.firstCall.thisValue.should.equal(model);
      } catch (error) {
        should.fail('should.fail', '');
      }
    });
  });

  describe('getUser()', () => {
    it('should call `authenticateHandler.getUser()`', () => {
      const authenticateHandler = {
        handle: sinon.stub().returns(Promise.resolve({})),
      };
      const model = {
        getClient() {},
        saveAuthorizationCode() {},
      };
      const handler = new AuthorizeHandler({
        authenticateHandler,
        authorizationCodeLifetime: 120,
        model,
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {},
      });
      const response = new Response();

      return handler
        .getUser(request, response)
        .then(() => {
          authenticateHandler.handle.callCount.should.equal(1);
          authenticateHandler.handle.firstCall.args.should.have.length(2);
          authenticateHandler.handle.firstCall.args[0].should.equal(request);
          authenticateHandler.handle.firstCall.args[1].should.equal(response);
        })
        .catch(() => {
          should.fail('should.fail', '');
        });
    });
  });

  // describe('saveAuthorizationCode()', () => {
  // it('should call `model.saveAuthorizationCode()`', () => {
  //   const model = {
  //     getAccessToken() {},
  //     getClient() {},
  //     saveAuthorizationCode: sinon.stub().returns({}),
  //   };
  //   const handler = new AuthorizeHandler({
  //     authorizationCodeLifetime: 120,
  //     model,
  //   });
  //   return handler
  //     .saveAuthorizationCode(
  //       'foo',
  //       'bar' as any,
  //       'qux',
  //       'biz' as any,
  //       'baz',
  //       'boz' as any,
  //     )
  //     .then(() => {
  //       model.saveAuthorizationCode.callCount.should.equal(1);
  //       model.saveAuthorizationCode.firstCall.args.should.have.length(3);
  //       model.saveAuthorizationCode.firstCall.args[0].should.eql({
  //         authorizationCode: 'foo',
  //         expiresAt: 'bar',
  //         redirectUri: 'baz',
  //         scope: 'qux',
  //       });
  //       model.saveAuthorizationCode.firstCall.args[1].should.equal('biz');
  //       model.saveAuthorizationCode.firstCall.args[2].should.equal('boz');
  //       model.saveAuthorizationCode.firstCall.thisValue.should.equal(model);
  //     })
  //     .catch(() => should.fail('should.fail', ''));
  // });
  // });
});
