import { HOUR, MINUTE, SECOND, WEEK } from './constants';
import { InvalidArgumentError } from './errors';
import {
  AuthenticateHandler,
  AuthorizeHandler,
  RevokeHandler,
  TokenHandler,
} from './handlers';
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
  authenticate(
    request: Request,
    response?: Response,
    scope?: string,
  ): Promise<any>;
  authenticate(
    request: Request,
    response?: Response,
    // tslint:disable-next-line:unified-signatures
    options?: any,
  ): Promise<any>;

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

    return new AuthenticateHandler(opt).handle(request, response as any);
  }

  /**
   * Authorize a request.
   */

  async authorize(request: Request, response: Response, options?: any) {
    const opts = {
      allowEmptyState: false,
      accessTokenLifetime: HOUR / SECOND,
      authorizationCodeLifetime: (MINUTE * 5) / SECOND,
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
      accessTokenLifetime: HOUR / SECOND, // 1 hour in seconds.
      refreshTokenLifetime: (WEEK * 2) / SECOND, // 2 weeks.
      allowExtendedTokenAttributes: false,
      requireClientAuthentication: {},
      ...this.options,
      ...options,
    };

    return new TokenHandler(opts).handle(request, response);
  }

  /**
   * Revoke a token.
   */

  async revoke(request: Request, response: Response, options: any) {
    const opt = { ...this.options, ...options };

    return new RevokeHandler(opt).handle(request, response);
  }
}
