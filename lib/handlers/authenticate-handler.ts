import {
  InsufficientScopeError,
  InvalidArgumentError,
  InvalidRequestError,
  InvalidTokenError,
  OAuthError,
  ServerError,
  UnauthorizedRequestError,
} from '../errors';
import { Model, Token } from '../interfaces';
import { Request } from '../request';
import { Response } from '../response';

export class AuthenticateHandler {
  addAcceptedScopesHeader: any;
  addAuthorizedScopesHeader: any;
  allowBearerTokensInQueryString: any;
  model: Model;
  scope: any;
  constructor(options: any = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getAccessToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getAccessToken()`',
      );
    }

    if (options.scope && options.addAcceptedScopesHeader === undefined) {
      throw new InvalidArgumentError(
        'Missing parameter: `addAcceptedScopesHeader`',
      );
    }

    if (options.scope && options.addAuthorizedScopesHeader === undefined) {
      throw new InvalidArgumentError(
        'Missing parameter: `addAuthorizedScopesHeader`',
      );
    }

    if (options.scope && !options.model.verifyScope) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `verifyScope()`',
      );
    }

    this.addAcceptedScopesHeader = options.addAcceptedScopesHeader;
    this.addAuthorizedScopesHeader = options.addAuthorizedScopesHeader;
    this.allowBearerTokensInQueryString =
      options.allowBearerTokensInQueryString;
    this.model = options.model;
    this.scope = options.scope;
  }

  /**
   * Authenticate Handler.
   */

  async handle(request: Request, response: Response) {
    if (!(request instanceof Request)) {
      throw new InvalidArgumentError(
        'Invalid argument: `request` must be an instance of Request',
      );
    }

    if (!(response instanceof Response)) {
      throw new InvalidArgumentError(
        'Invalid argument: `response` must be an instance of Response',
      );
    }

    // Extend model object with request
    this.model.request = request;

    try {
      let token = await this.getTokenFromRequest(request);
      token = await this.getAccessToken(token);
      this.validateAccessToken(token);
      if (this.scope) {
        await this.verifyScope(token);
      }
      this.updateResponse(response, token);

      return token;
    } catch (e) {
      // Include the "WWW-Authenticate" response header field if the client
      // lacks any authentication information.
      //
      // @see https://tools.ietf.org/html/rfc6750#section-3.1
      if (e instanceof UnauthorizedRequestError) {
        response.set('WWW-Authenticate', 'Bearer realm="Service"');
      }

      if (!(e instanceof OAuthError)) {
        throw new ServerError(e);
      }

      throw e;
    }
  }

  /**
   * Get the token from the header or body, depending on the request.
   *
   * "Clients MUST NOT use more than one method to transmit the token in each request."
   *
   * @see https://tools.ietf.org/html/rfc6750#section-2
   */

  getTokenFromRequest(request: Request) {
    const headerToken = request.get('Authorization');
    const queryToken = request.query.access_token;
    const bodyToken = request.body.access_token;

    if ((!!headerToken && 1) + (!!queryToken && 1) + (!!bodyToken && 1) > 1) {
      throw new InvalidRequestError(
        'Invalid request: only one authentication method is allowed',
      );
    }

    if (headerToken) {
      return this.getTokenFromRequestHeader(request);
    }

    if (queryToken) {
      return this.getTokenFromRequestQuery(request);
    }

    if (bodyToken) {
      return this.getTokenFromRequestBody(request);
    }

    throw new UnauthorizedRequestError(
      'Unauthorized request: no authentication given',
    );
  }

  /**
   * Get the token from the request header.
   *
   * @see http://tools.ietf.org/html/rfc6750#section-2.1
   */

  getTokenFromRequestHeader(request: Request) {
    const token = request.get('Authorization');
    const matches = token.match(/Bearer\s(\S+)/);

    if (!matches) {
      throw new InvalidRequestError(
        'Invalid request: malformed authorization header',
      );
    }

    return matches[1];
  }

  /**
   * Get the token from the request query.
   *
   * "Don't pass bearer tokens in page URLs:  Bearer tokens SHOULD NOT be passed in page
   * URLs (for example, as query string parameters). Instead, bearer tokens SHOULD be
   * passed in HTTP message headers or message bodies for which confidentiality measures
   * are taken. Browsers, web servers, and other software may not adequately secure URLs
   * in the browser history, web server logs, and other data structures. If bearer tokens
   * are passed in page URLs, attackers might be able to steal them from the history data,
   * logs, or other unsecured locations."
   *
   * @see http://tools.ietf.org/html/rfc6750#section-2.3
   */

  getTokenFromRequestQuery(request: Request) {
    if (!this.allowBearerTokensInQueryString) {
      throw new InvalidRequestError(
        'Invalid request: do not send bearer tokens in query URLs',
      );
    }

    return request.query.access_token;
  }

  /**
   * Get the token from the request body.
   *
   * "The HTTP request method is one for which the request-body has defined semantics.
   * In particular, this means that the "GET" method MUST NOT be used."
   *
   * @see http://tools.ietf.org/html/rfc6750#section-2.2
   */

  getTokenFromRequestBody(request: Request) {
    if (request.method === 'GET') {
      throw new InvalidRequestError(
        'Invalid request: token may not be passed in the body when using the GET verb',
      );
    }

    if (!request.is('application/x-www-form-urlencoded')) {
      throw new InvalidRequestError(
        'Invalid request: content must be application/x-www-form-urlencoded',
      );
    }

    return request.body.access_token;
  }

  /**
   * Get the access token from the model.
   */

  async getAccessToken(token: string) {
    const accessToken = await this.model.getAccessToken(token);
    if (!accessToken) {
      throw new InvalidTokenError('Invalid token: access token is invalid');
    }

    if (!accessToken.user) {
      throw new ServerError(
        'Server error: `getAccessToken()` did not return a `user` object',
      );
    }

    return accessToken;
  }

  /**
   * Validate access token.
   */

  validateAccessToken(accessToken: Token) {
    if (!(accessToken.accessTokenExpiresAt instanceof Date)) {
      throw new ServerError(
        'Server error: `accessTokenExpiresAt` must be a Date instance',
      );
    }

    if (accessToken.accessTokenExpiresAt < new Date()) {
      throw new InvalidTokenError('Invalid token: access token has expired');
    }

    return accessToken;
  }

  /**
   * Verify scope.
   */

  async verifyScope(accessToken: Token) {
    const scope = await this.model.verifyScope(accessToken, this.scope);
    if (!scope) {
      throw new InsufficientScopeError(
        'Insufficient scope: authorized scope is insufficient',
      );
    }

    return scope;
  }

  /**
   * Update response.
   */

  updateResponse(response: Response, accessToken: Token) {
    if (this.scope && this.addAcceptedScopesHeader) {
      response.set('X-Accepted-OAuth-Scopes', this.scope);
    }

    if (this.scope && this.addAuthorizedScopesHeader) {
      response.set('X-OAuth-Scopes', accessToken.scope);
    }
  }
}
