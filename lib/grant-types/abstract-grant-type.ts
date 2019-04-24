import { MS_IN_S } from '../constants';
import { InvalidArgumentError, InvalidScopeError } from '../errors';
import { Client, Model, User } from '../interfaces';
import { Request } from '../request';
import * as tokenUtil from '../utils/token-util';
import * as is from '../validator/is';

export class AbstractGrantType {
  accessTokenLifetime: number;
  model: Model;
  refreshTokenLifetime: number;
  alwaysIssueNewRefreshToken: boolean;

  constructor(options: any = {}) {
    if (!options.accessTokenLifetime) {
      throw new InvalidArgumentError(
        'Missing parameter: `accessTokenLifetime`',
      );
    }

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
  }

  /**
   * Generate access token.
   */

  async generateAccessToken(client?: Client, user?: User, scope?: string) {
    if (this.model.generateAccessToken) {
      const token = await this.model.generateAccessToken(client, user, scope);

      return token || tokenUtil.GenerateRandomToken();
    }

    return tokenUtil.GenerateRandomToken();
  }

  /**
   * Generate refresh token.
   */

  async generateRefreshToken(client?: Client, user?: User, scope?: string) {
    if (this.model.generateRefreshToken) {
      const token = await this.model.generateRefreshToken(client, user, scope);

      return token || tokenUtil.GenerateRandomToken();
    }

    return tokenUtil.GenerateRandomToken();
  }

  /**
   * Get access token expiration date.
   */

  getAccessTokenExpiresAt() {
    return new Date(Date.now() + this.accessTokenLifetime * MS_IN_S);
  }

  /**
   * Get refresh token expiration date.
   */

  getRefreshTokenExpiresAt() {
    return new Date(Date.now() + this.refreshTokenLifetime * MS_IN_S);
  }

  /**
   * Get scope from the request body.
   */

  getScope(request: Request) {
    if (!is.nqschar(request.body.scope)) {
      throw new InvalidArgumentError('Invalid parameter: `scope`');
    }

    return request.body.scope;
  }

  /**
   * Validate requested scope.
   */
  async validateScope(user: User, client: Client, scope: string) {
    if (this.model.validateScope) {
      const validatedScope = await this.model.validateScope(
        user,
        client,
        scope,
      );
      if (!validatedScope) {
        throw new InvalidScopeError(
          'Invalid scope: Requested scope is invalid',
        );
      }

      return validatedScope;
    }

    return scope;
  }
}
