import { InvalidArgumentError } from '../errors/invalid-argument-error';
import { InvalidGrantError } from '../errors/invalid-grant-error';
import { InvalidRequestError } from '../errors/invalid-request-error';
import { ServerError } from '../errors/server-error';
import { Client } from '../interfaces/client.interface';
import { RefreshToken } from '../interfaces/refresh-token.interface';
import { User } from '../interfaces/user.interface';
import { Request } from '../request';
import * as is from '../validator/is';
import { AbstractGrantType } from './abstract-grant-type';

export class RefreshTokenGrantType extends AbstractGrantType {
  constructor(options: any = {}) {
    super(options);

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getRefreshToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getRefreshToken()`',
      );
    }

    if (!options.model.revokeToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `revokeToken()`',
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveToken()`',
      );
    }
  }

  /**
   * Handle refresh token grant.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-6
   */

  async handle(request: Request, client: Client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const token = await this.getRefreshToken(request, client);
    await this.revokeToken(token);

    return this.saveToken(token.user, client, token.scope);
  }

  /**
   * Get refresh token.
   */

  async getRefreshToken(request: Request, client: Client) {
    if (!request.body.refresh_token) {
      throw new InvalidRequestError('Missing parameter: `refresh_token`');
    }

    if (!is.vschar(request.body.refresh_token)) {
      throw new InvalidRequestError('Invalid parameter: `refresh_token`');
    }

    const token = await this.model.getRefreshToken(request.body.refresh_token);

    if (!token) {
      throw new InvalidGrantError('Invalid grant: refresh token is invalid');
    }

    if (!token.client) {
      throw new ServerError(
        'Server error: `getRefreshToken()` did not return a `client` object',
      );
    }

    if (!token.user) {
      throw new ServerError(
        'Server error: `getRefreshToken()` did not return a `user` object',
      );
    }

    if (token.client.id !== client.id) {
      throw new InvalidGrantError('Invalid grant: refresh token is invalid');
    }

    if (
      token.refreshTokenExpiresAt &&
      !(token.refreshTokenExpiresAt instanceof Date)
    ) {
      throw new ServerError(
        'Server error: `refreshTokenExpiresAt` must be a Date instance',
      );
    }

    if (
      token.refreshTokenExpiresAt &&
      token.refreshTokenExpiresAt < new Date()
    ) {
      throw new InvalidGrantError('Invalid grant: refresh token has expired');
    }

    return token;
  }

  /**
   * Revoke the refresh token.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-6
   */

  async revokeToken(token: RefreshToken) {
    if (this.alwaysIssueNewRefreshToken === false) {
      return token;
    }

    const status = await this.model.revokeToken(token);
    if (!status) {
      throw new InvalidGrantError('Invalid grant: refresh token is invalid');
    }

    return token;
  }

  /**
   * Save token.
   */

  async saveToken(user: User, client: Client, scope: string) {
    const fns = [
      this.generateAccessToken(client, user, scope),
      this.generateRefreshToken(client, user, scope),
      this.getAccessTokenExpiresAt(),
      this.getRefreshTokenExpiresAt(),
    ];

    const [
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    ] = await Promise.all(fns as any);

    const token: any = {
      accessToken,
      accessTokenExpiresAt,
      scope,
    };

    if (this.alwaysIssueNewRefreshToken !== false) {
      token.refreshToken = refreshToken;
      token.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }

    const savedToken = await this.model.saveToken(token, client, user);

    return savedToken;
  }
}
