import { AbstractGrantType } from '.';
import {
  InvalidArgumentError,
  InvalidGrantError,
  InvalidRequestError,
} from '../errors';
import { Client, Token, User } from '../interfaces';
import { Request } from '../request';
import * as is from '../validator/is';

export class PasswordGrantType extends AbstractGrantType {
  constructor(options: any = {}) {
    super(options);

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUser) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getUser()`',
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveToken()`',
      );
    }
  }

  /**
   * Retrieve the user from the model using a username/password combination.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.3.2
   */

  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const scope = this.getScope(request);
    const user = await this.getUser(request);

    return this.saveToken(user, client, scope);
  }

  /**
   * Get user using a username/password combination.
   */

  async getUser(request: Request) {
    if (!request.body.username) {
      throw new InvalidRequestError('Missing parameter: `username`');
    }

    if (!request.body.password) {
      throw new InvalidRequestError('Missing parameter: `password`');
    }

    if (!is.uchar(request.body.username)) {
      throw new InvalidRequestError('Invalid parameter: `username`');
    }

    if (!is.uchar(request.body.password)) {
      throw new InvalidRequestError('Invalid parameter: `password`');
    }

    const user = await this.model.getUser(
      request.body.username,
      request.body.password,
    );
    if (!user) {
      throw new InvalidGrantError(
        'Invalid grant: user credentials are invalid',
      );
    }

    return user;
  }

  /**
   * Save token.
   */

  async saveToken(user: User, client: Client, scope: string) {
    const accessScope = await this.validateScope(user, client, scope);
    const accessToken = await this.generateAccessToken(client, user, scope);
    const refreshToken = await this.generateRefreshToken(client, user, scope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

    const token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope: accessScope,
    } as Token;

    return this.model.saveToken(token, client, user);
  }
}
