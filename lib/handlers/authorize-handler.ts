import { has } from 'lodash';
import { format, parse, UrlWithParsedQuery } from 'url';
import { AccessDeniedError } from '../errors/access-denied-error';
import { InvalidArgumentError } from '../errors/invalid-argument-error';
import { InvalidClientError } from '../errors/invalid-client-error';
import { InvalidRequestError } from '../errors/invalid-request-error';
import { InvalidScopeError } from '../errors/invalid-scope-error';
import { OAuthError } from '../errors/oauth-error';
import { ServerError } from '../errors/server-error';
import { UnauthorizedClientError } from '../errors/unauthorized-client-error';
import { UnsupportedResponseTypeError } from '../errors/unsupported-response-type-error';
import { AuthenticateHandler } from '../handlers/authenticate-handler';
import { AuthorizationCode } from '../interfaces/authorization-code.interface';
import { Client } from '../interfaces/client.interface';
import { Model } from '../interfaces/model.interface';
import { User } from '../interfaces/user.interface';
import { Request } from '../request';
import { Response } from '../response';
import { CodeResponseType } from '../response-types/code-response-type';
import * as tokenUtil from '../utils/token-util';
import * as is from '../validator/is';

const responseTypes = {
  code: CodeResponseType,
  // token: require('../response-types/token-response-type')
};

export class AuthorizeHandler {
  allowEmptyState: boolean;
  authenticateHandler: any;
  authorizationCodeLifetime: number;
  model: Model;
  constructor(options: any = {}) {
    if (options.authenticateHandler && !options.authenticateHandler.handle) {
      throw new InvalidArgumentError(
        'Invalid argument: authenticateHandler does not implement `handle()`',
      );
    }

    if (!options.authorizationCodeLifetime) {
      throw new InvalidArgumentError(
        'Missing parameter: `authorizationCodeLifetime`',
      );
    }

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getClient) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getClient()`',
      );
    }

    if (!options.model.saveAuthorizationCode) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveAuthorizationCode()`',
      );
    }

    this.allowEmptyState = options.allowEmptyState;
    this.authenticateHandler =
      options.authenticateHandler || new AuthenticateHandler(options);
    this.authorizationCodeLifetime = options.authorizationCodeLifetime;
    this.model = options.model;
  }

  /**
   * Authorize Handler.
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

    if (request.query.allowed === 'false') {
      throw new AccessDeniedError(
        'Access denied: user denied access to application',
      );
    }

    const fns = [
      this.getAuthorizationCodeLifetime(),
      this.getClient(request),
      this.getUser(request, response),
    ];

    const [expiresAt, client, user] = await Promise.all(fns);
    const uri = this.getRedirectUri(request, client);
    let scope: any;
    let state: any;
    let ResponseType: any;

    try {
      scope = this.getScope(request);
      const authorizationCode = await this.generateAuthorizationCode(
        client,
        user,
        scope,
      );
      state = this.getState(request);
      ResponseType = this.getResponseType(request);
      const code = await this.saveAuthorizationCode(
        authorizationCode,
        expiresAt,
        scope,
        client,
        uri,
        user,
      );
      const responseType = new ResponseType(code.authorizationCode);
      const redirectUri = this.buildSuccessRedirectUri(uri, responseType);
      this.updateResponse(response, redirectUri, state);

      return code;
    } catch (e) {
      if (!(e instanceof OAuthError)) {
        e = new ServerError(e);
      }
      const redirectUri = this.buildErrorRedirectUri(uri, e);
      this.updateResponse(response, redirectUri, state);
      throw e;
    }
  }

  /**
   * Generate authorization code.
   */

  generateAuthorizationCode(client, user, scope) {
    if (this.model.generateAuthorizationCode) {
      return this.model.generateAuthorizationCode(client, user, scope);
    }

    return tokenUtil.GenerateRandomToken();
  }

  /**
   * Get authorization code lifetime.
   */

  getAuthorizationCodeLifetime() {
    const expires = new Date();

    expires.setSeconds(expires.getSeconds() + this.authorizationCodeLifetime);

    return expires;
  }

  /**
   * Get the client from the model.
   */

  async getClient(request: Request) {
    const clientId = request.body.client_id || request.query.client_id;

    if (!clientId) {
      throw new InvalidRequestError('Missing parameter: `client_id`');
    }

    if (!is.vschar(clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }

    const redirectUri = request.body.redirect_uri || request.query.redirect_uri;

    if (redirectUri && !is.uri(redirectUri)) {
      throw new InvalidRequestError(
        'Invalid request: `redirect_uri` is not a valid URI',
      );
    }

    const client = await this.model.getClient(clientId);
    if (!client) {
      throw new InvalidClientError(
        'Invalid client: client credentials are invalid',
      );
    }

    if (!client.grants) {
      throw new InvalidClientError('Invalid client: missing client `grants`');
    }

    if (!client.grants.includes('authorization_code')) {
      throw new UnauthorizedClientError(
        'Unauthorized client: `grant_type` is invalid',
      );
    }

    if (!client.redirectUris || client.redirectUris.length === 0) {
      throw new InvalidClientError(
        'Invalid client: missing client `redirectUri`',
      );
    }

    if (redirectUri && !client.redirectUris.includes(redirectUri)) {
      throw new InvalidClientError(
        'Invalid client: `redirect_uri` does not match client value',
      );
    }

    return client;
  }

  /**
   * Get scope from the request.
   */

  getScope = (request: Request) => {
    const scope = request.body.scope || request.query.scope;

    if (!is.nqschar(scope)) {
      throw new InvalidScopeError('Invalid parameter: `scope`');
    }

    return scope;
  };

  /**
   * Get state from the request.
   */

  getState(request) {
    const state = request.body.state || request.query.state;

    if (!this.allowEmptyState && !state) {
      throw new InvalidRequestError('Missing parameter: `state`');
    }

    if (!is.vschar(state)) {
      throw new InvalidRequestError('Invalid parameter: `state`');
    }

    return state;
  }

  /**
   * Get user by calling the authenticate middleware.
   */

  async getUser(request: Request, response: Response) {
    if (this.authenticateHandler instanceof AuthenticateHandler) {
      const data = await this.authenticateHandler.handle(request, response);

      return data.user;
    }

    const user = await this.authenticateHandler.handle(request, response);
    if (!user) {
      throw new ServerError(
        'Server error: `handle()` did not return a `user` object',
      );
    }

    return user;
  }

  /**
   * Get redirect URI.
   */

  getRedirectUri = (request: Request, client) => {
    return (
      request.body.redirect_uri ||
      request.query.redirect_uri ||
      client.redirectUris[0]
    );
  };

  /**
   * Save authorization code.
   */

  async saveAuthorizationCode(
    authorizationCode: string,
    expiresAt: Date,
    scope: string,
    client: Client,
    redirectUri: string,
    user: User,
  ) {
    const code = {
      authorizationCode,
      expiresAt,
      redirectUri,
      scope,
    } as AuthorizationCode;

    return this.model.saveAuthorizationCode(code, client, user);
  }

  /**
   * Get response type.
   */

  getResponseType = (request: Request) => {
    const responseType =
      request.body.response_type || request.query.response_type;

    if (!responseType) {
      throw new InvalidRequestError('Missing parameter: `response_type`');
    }

    if (!has(responseTypes, responseType)) {
      throw new UnsupportedResponseTypeError(
        'Unsupported response type: `response_type` is not supported',
      );
    }

    return responseTypes[responseType];
  };

  /**
   * Build a successful response that redirects the user-agent to the client-provided url.
   */

  buildSuccessRedirectUri = (
    redirectUri: string,
    responseType: CodeResponseType,
  ) => {
    return responseType.buildRedirectUri(redirectUri);
  };

  /**
   * Build an error response that redirects the user-agent to the client-provided url.
   */

  buildErrorRedirectUri = (redirectUri: string, error: Error) => {
    const uri = parse(redirectUri, true);

    uri.query = {
      error: error.name,
    };

    if (error.message) {
      uri.query.error_description = error.message;
    }

    return uri;
  };

  /**
   * Update response with the redirect uri and the state parameter, if available.
   */

  updateResponse = (
    response: Response,
    redirectUri: UrlWithParsedQuery,
    state: string,
  ) => {
    redirectUri.query = redirectUri.query || {};

    if (state) {
      redirectUri.query.state = state;
    }

    response.redirect(format(redirectUri));
  };
}
