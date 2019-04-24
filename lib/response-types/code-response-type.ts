import { MS_IN_S } from '../constants';
import { InvalidArgumentError } from '../errors';
import { AuthorizationCode, Client, Model, User } from '../interfaces';
import { Request } from '../request';
import * as tokenUtil from '../utils/token-util';
export class CodeResponseType {
  code: any;
  authorizationCodeLifetime: number;
  model: Model;
  constructor(options: any = {}) {
    if (!options.authorizationCodeLifetime) {
      throw new InvalidArgumentError(
        'Missing parameter: `authorizationCodeLifetime`',
      );
    }

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.saveAuthorizationCode) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveAuthorizationCode()`',
      );
    }

    this.code = undefined;
    this.authorizationCodeLifetime = options.authorizationCodeLifetime;
    this.model = options.model;
  }

  /**
   * Handle code response type.
   */

  async handle(
    request: Request,
    client: Client,
    user: User,
    uri: string,
    scope: string,
  ) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    if (!user) {
      throw new InvalidArgumentError('Missing parameter: `user`');
    }

    if (!uri) {
      throw new InvalidArgumentError('Missing parameter: `uri`');
    }

    const authorizationCode = await this.generateAuthorizationCode(
      client,
      user,
      scope,
    );
    const expiresAt = this.getAuthorizationCodeExpiresAt(client);

    const code = await this.saveAuthorizationCode(
      authorizationCode,
      expiresAt,
      scope,
      client,
      uri,
      user,
    );
    this.code = code.authorizationCode;

    return code;
  }

  /**
   * Get authorization code expiration date.
   */

  getAuthorizationCodeExpiresAt(client: Client) {
    const authorizationCodeLifetime = this.getAuthorizationCodeLifetime(client);

    return new Date(Date.now() + authorizationCodeLifetime * MS_IN_S);
  }

  /**
   * Get authorization code lifetime.
   */

  getAuthorizationCodeLifetime(client: Client) {
    return client.authorizationCodeLifetime || this.authorizationCodeLifetime;
  }

  /**
   * Save authorization code.
   */

  async saveAuthorizationCode(
    authorizationCode: string,
    expiresAt: Date,
    scope: string,
    client: Client,
    redirectUri: any,
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
   * Generate authorization code.
   */

  async generateAuthorizationCode(client: Client, user: User, scope: string) {
    if (this.model.generateAuthorizationCode) {
      return this.model.generateAuthorizationCode(client, user, scope);
    }

    return tokenUtil.GenerateRandomToken();
  }

  /**
   * Build redirect uri.
   */

  buildRedirectUri(redirectUri: any) {
    if (!redirectUri) {
      throw new InvalidArgumentError('Missing parameter: `redirectUri`');
    }

    redirectUri.search = undefined;

    return this.setRedirectUriParam(redirectUri, 'code', this.code);
  }

  /**
   * Set redirect uri parameter.
   */

  setRedirectUriParam(redirectUri: any, key: string, value: string) {
    if (!redirectUri) {
      throw new InvalidArgumentError('Missing parameter: `redirectUri`');
    }

    if (!key) {
      throw new InvalidArgumentError('Missing parameter: `key`');
    }

    redirectUri.query = redirectUri.query || {};
    redirectUri.query[key] = value;

    return redirectUri;
  }
}
