import { AccessDeniedError } from './errors/access-denied-error';
import { InsufficientScopeError } from './errors/insufficient-scope-error';
import { InvalidArgumentError } from './errors/invalid-argument-error';
import { InvalidClientError } from './errors/invalid-client-error';
import { InvalidGrantError } from './errors/invalid-grant-error';
import { InvalidRequestError } from './errors/invalid-request-error';
import { InvalidScopeError } from './errors/invalid-scope-error';
import { InvalidTokenError } from './errors/invalid-token-error';
import { OAuthError } from './errors/oauth-error';
import { ServerError } from './errors/server-error';
import { UnauthorizedClientError } from './errors/unauthorized-client-error';
import { UnauthorizedRequestError } from './errors/unauthorized-request-error';
import { UnsupportedGrantTypeError } from './errors/unsupported-grant-type-error';
import { UnsupportedResponseTypeError } from './errors/unsupported-response-type-error';
import { AbstractGrantType } from './grant-types/abstract-grant-type';
import { AuthenticateHandler } from './handlers/authenticate-handler';
import { AuthorizeHandler } from './handlers/authorize-handler';
import { TokenHandler } from './handlers/token-handler';
import { Request } from './request';
import { Response } from './response';

export class OAuth2Server {
  options: any;
  constructor(options: any = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.options = options;
  }

  /**
   * Authenticate a token.
   */
  authenticate(request: Request, response?: Response, scope?: string);
  // tslint:disable-next-line:unified-signatures
  authenticate(request: Request, response?: Response, options?: any);

  async authenticate(
    request: Request,
    response?: Response,
    options?: string | any,
  ) {
    let opt = options;
    if (typeof opt === 'string') {
      opt = { scope: opt };
    }

    opt = {
      addAcceptedScopesHeader: true,
      addAuthorizedScopesHeader: true,
      allowBearerTokensInQueryString: false,
      ...this.options,
      ...opt,
    };

    return new AuthenticateHandler(opt).handle(request, response);
  }

  /**
   * Authorize a request.
   */

  async authorize(request: Request, response: Response, options?: any) {
    const defaultLifeTime = 300;
    const opts = {
      allowEmptyState: false,
      authorizationCodeLifetime: defaultLifeTime,
      ...this.options,
      ...options,
    };

    return new AuthorizeHandler(opts).handle(request, response);
  }

  /**
   * Create a token.
   */

  async token(request: Request, response: Response, options?: any) {
    const opts = {
      accessTokenLifetime: 60 * 60, // 1 hour.
      refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
      allowExtendedTokenAttributes: false,
      requireClientAuthentication: {},
      ...this.options,
      ...options,
    };

    return new TokenHandler(opts).handle(request, response);
  }

  static Request = Request;
  static Response = Response;
  static AbstractGrantType = AbstractGrantType;
  static AccessDeniedError = AccessDeniedError;
  static InsufficientScopeError = InsufficientScopeError;
  static InvalidArgumentError = InvalidArgumentError;
  static InvalidClientError = InvalidClientError;
  static InvalidGrantError = InvalidGrantError;
  static InvalidRequestError = InvalidRequestError;
  static InvalidScopeError = InvalidScopeError;
  static InvalidTokenError = InvalidTokenError;
  static OAuthError = OAuthError;
  static ServerError = ServerError;
  static UnauthorizedClientError = UnauthorizedClientError;
  static UnauthorizedRequestError = UnauthorizedRequestError;
  static UnsupportedGrantTypeError = UnsupportedGrantTypeError;
  static UnsupportedResponseTypeError = UnsupportedResponseTypeError;
}
