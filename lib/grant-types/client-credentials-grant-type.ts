import { AbstractGrantType } from '.';
import { InvalidArgumentError, InvalidGrantError } from '../errors';
import { Client, Token, User } from '../interfaces';
import { Request } from '../request';

export class ClientCredentialsGrantType extends AbstractGrantType {
  constructor(options: any = {}) {
    super(options);
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUserFromClient) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getUserFromClient()`',
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveToken()`',
      );
    }
  }

  /**
   * Handle client credentials grant.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-4.4.2
   */

  async handle(request: Request, client: Client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const scope = this.getScope(request);
    const user = await this.getUserFromClient(client);

    return this.saveToken(user, client, scope);
  }

  /**
   * Retrieve the user using client credentials.
   */

  async getUserFromClient(client: Client) {
    const user = await this.model.getUserFromClient(client);
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
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();

    const token = {
      accessToken,
      accessTokenExpiresAt,
      scope: accessScope,
    } as Token;

    return this.model.saveToken(token, client, user);
  }
}
