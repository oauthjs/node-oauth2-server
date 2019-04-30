import * as auth from 'basic-auth';
import {
  InvalidArgumentError,
  InvalidClientError,
  InvalidRequestError,
  InvalidTokenError,
  OAuthError,
  ServerError,
} from '../errors';
import { Client, Model } from '../interfaces';
import { Request } from '../request';
import { Response } from '../response';
import { oneSuccess } from '../utils/fn';
import * as is from '../validator/is';

export class RevokeHandler {
  model: Model;
  constructor(options: any = {}) {
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getClient) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getClient()`',
      );
    }

    if (!options.model.getRefreshToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getRefreshToken()`',
      );
    }

    if (!options.model.getAccessToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getAccessToken()`',
      );
    }

    if (!options.model.revokeToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `revokeToken()`',
      );
    }

    this.model = options.model;
  }

  /**
   * Revoke Handler.
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

    if (request.method !== 'POST') {
      throw new InvalidRequestError('Invalid request: method must be POST');
    }

    if (!request.is('application/x-www-form-urlencoded')) {
      throw new InvalidRequestError(
        'Invalid request: content must be application/x-www-form-urlencoded',
      );
    }
    try {
      const client = await this.getClient(request, response);

      return this.handleRevokeToken(request, client);
    } catch (e) {
      let error = e;
      if (!(error instanceof OAuthError)) {
        error = new ServerError(error);
      }
      /**
       * All necessary information is conveyed in the response code.
       *
       * Note: invalid tokens do not cause an error response since the client
       * cannot handle such an error in a reasonable way.  Moreover, the
       * purpose of the revocation request, invalidating the particular token,
       * is already achieved.
       * @see https://tools.ietf.org/html/rfc7009#section-2.2
       */
      if (!(error instanceof InvalidTokenError)) {
        this.updateErrorResponse(response, error);
      }

      throw error;
    }
  }

  /**
   * Revoke a refresh or access token.
   *
   * Handle the revoking of refresh tokens, and access tokens if supported / desirable
   * RFC7009 specifies that "If the server is unable to locate the token using
   * the given hint, it MUST extend its search across all of its supported token types"
   */

  async handleRevokeToken(request: Request, client: Client) {
    try {
      let token = await this.getTokenFromRequest(request);
      token = await oneSuccess([
        this.getAccessToken(token, client),
        this.getRefreshToken(token, client),
      ]);

      return this.revokeToken(token);
    } catch (errors) {
      throw errors;
    }
  }

  /**
   * Get the client from the model.
   */

  async getClient(request: Request, response: Response) {
    const credentials = this.getClientCredentials(request);

    if (!credentials.clientId) {
      throw new InvalidRequestError('Missing parameter: `client_id`');
    }

    if (!credentials.clientSecret) {
      throw new InvalidRequestError('Missing parameter: `client_secret`');
    }

    if (!is.vschar(credentials.clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }

    if (!is.vschar(credentials.clientSecret)) {
      throw new InvalidRequestError('Invalid parameter: `client_secret`');
    }
    try {
      const client = await this.model.getClient(
        credentials.clientId,
        credentials.clientSecret,
      );
      if (!client) {
        throw new InvalidClientError('Invalid client: client is invalid');
      }

      if (!client.grants) {
        throw new ServerError('Server error: missing client `grants`');
      }

      if (!(client.grants instanceof Array)) {
        throw new ServerError('Server error: `grants` must be an array');
      }

      return client;
    } catch (e) {
      // Include the "WWW-Authenticate" response header field if the client
      // attempted to authenticate via the "Authorization" request header.
      //
      // @see https://tools.ietf.org/html/rfc6749#section-5.2.
      if (e instanceof InvalidClientError && request.get('authorization')) {
        response.set('WWW-Authenticate', 'Basic realm="Service"');

        throw new InvalidClientError(e, { code: 401 });
      }

      throw e;
    }
  }

  /**
   * Get client credentials.
   *
   * The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
   * the `client_id` and `client_secret` can be embedded in the body.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   */

  getClientCredentials(request: Request) {
    const credentials = auth(request as any);

    if (credentials) {
      return { clientId: credentials.name, clientSecret: credentials.pass };
    }

    if (request.body.client_id && request.body.client_secret) {
      return {
        clientId: request.body.client_id,
        clientSecret: request.body.client_secret,
      };
    }

    throw new InvalidClientError(
      'Invalid client: cannot retrieve client credentials',
    );
  }

  /**
   * Get the token from the body.
   *
   * @see https://tools.ietf.org/html/rfc7009#section-2.1
   */

  getTokenFromRequest(request: Request) {
    const bodyToken = request.body.token;

    if (!bodyToken) {
      throw new InvalidRequestError('Missing parameter: `token`');
    }

    return bodyToken;
  }

  /**
   * Get refresh token.
   */

  async getRefreshToken(token, client: Client) {
    const refreshToken = await this.model.getRefreshToken(token);
    if (!refreshToken) {
      throw new InvalidTokenError('Invalid token: refresh token is invalid');
    }

    if (!refreshToken.client) {
      throw new ServerError(
        'Server error: `getRefreshToken()` did not return a `client` object',
      );
    }

    if (!refreshToken.user) {
      throw new ServerError(
        'Server error: `getRefreshToken()` did not return a `user` object',
      );
    }

    if (refreshToken.client.id !== client.id) {
      throw new InvalidClientError('Invalid client: client is invalid');
    }

    if (
      refreshToken.refreshTokenExpiresAt &&
      !(refreshToken.refreshTokenExpiresAt instanceof Date)
    ) {
      throw new ServerError(
        'Server error: `refreshTokenExpiresAt` must be a Date instance',
      );
    }

    if (
      refreshToken.refreshTokenExpiresAt &&
      refreshToken.refreshTokenExpiresAt < new Date()
    ) {
      throw new InvalidTokenError('Invalid token: refresh token has expired');
    }

    return refreshToken;
  }

  /**
   * Get the access token from the model.
   */

  async getAccessToken(token: string, client: Client) {
    const accessToken = await this.model.getAccessToken(token);
    if (!accessToken) {
      throw new InvalidTokenError('Invalid token: access token is invalid');
    }

    if (!accessToken.client) {
      throw new ServerError(
        'Server error: `getAccessToken()` did not return a `client` object',
      );
    }

    if (!accessToken.user) {
      throw new ServerError(
        'Server error: `getAccessToken()` did not return a `user` object',
      );
    }

    if (accessToken.client.id !== client.id) {
      throw new InvalidClientError('Invalid client: client is invalid');
    }

    if (
      accessToken.accessTokenExpiresAt &&
      !(accessToken.accessTokenExpiresAt instanceof Date)
    ) {
      throw new ServerError('Server error: `expires` must be a Date instance');
    }

    if (
      accessToken.accessTokenExpiresAt &&
      accessToken.accessTokenExpiresAt < new Date()
    ) {
      throw new InvalidTokenError('Invalid token: access token has expired.');
    }

    return accessToken;
  }

  /**
   * Revoke the token.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-6
   */

  async revokeToken(token: any) {
    const revokedToken = await this.model.revokeToken(token);
    if (!revokedToken) {
      throw new InvalidTokenError('Invalid token: token is invalid');
    }

    return revokedToken;
  }

  /**
   * Update response when an error is thrown.
   */

  updateErrorResponse(response: Response, error: OAuthError) {
    response.body = {
      error: error.name,
      error_description: error.message,
    };

    response.status = error.code;
  }
}
