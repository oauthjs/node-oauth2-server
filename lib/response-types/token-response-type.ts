import { InvalidArgumentError } from '../errors';
import { ImplicitGrantType } from '../grant-types';
import { Client, Model, User } from '../interfaces';
import { Request } from '../request';

export class TokenResponseType {
  accessToken: string;
  accessTokenLifetime: number;
  model: Model;
  constructor(options: any = {}) {
    if (!options.accessTokenLifetime) {
      throw new InvalidArgumentError(
        'Missing parameter: `accessTokenLifetime`',
      );
    }

    this.accessToken = undefined;
    this.accessTokenLifetime = options.accessTokenLifetime;
    this.model = options.model;
  }

  /**
   * Handle token response type.
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

    const accessTokenLifetime = this.getAccessTokenLifetime(client);

    const options = {
      user,
      scope,
      model: this.model,
      accessTokenLifetime,
    };

    const grantType = new ImplicitGrantType(options);
    const token = await grantType.handle(request, client);
    this.accessToken = token.accessToken;

    return token;
  }

  /**
   * Get access token lifetime.
   */

  getAccessTokenLifetime(client: Client) {
    return client.accessTokenLifetime || this.accessTokenLifetime;
  }

  /**
   * Build redirect uri.
   */

  buildRedirectUri(redirectUri: any) {
    return this.setRedirectUriParam(
      redirectUri,
      'access_token',
      this.accessToken,
    );
  }

  /**
   * Set redirect uri parameter.
   */

  setRedirectUriParam(redirectUri: any, key: string, value: any) {
    if (!redirectUri) {
      throw new InvalidArgumentError('Missing parameter: `redirectUri`');
    }

    if (!key) {
      throw new InvalidArgumentError('Missing parameter: `key`');
    }

    redirectUri.hash = redirectUri.hash || '';
    redirectUri.hash += `${
      redirectUri.hash ? '&' : ''
    }${key}=${encodeURIComponent(value)}`;

    return redirectUri;
  }
}
