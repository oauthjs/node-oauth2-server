import { AbstractGrantType } from '.';
import { InvalidArgumentError } from '../errors';
import { Client, Token, User } from '../interfaces';
import { Request } from '../request';

export class ImplicitGrantType extends AbstractGrantType {
  scope: string;
  user: User;
  constructor(options: any = {}) {
    super(options);

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveToken()`',
      );
    }

    if (!options.user) {
      throw new InvalidArgumentError('Missing parameter: `user`');
    }

    this.scope = options.scope;
    this.user = options.user;
  }

  /**
   * Handle implicit token grant.
   */

  async handle(request: Request, client: Client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    return this.saveToken(this.user, client, this.scope);
  }

  /**
   * Save token.
   */

  async saveToken(user: User, client: Client, scope: string) {
    const validatedScope = await this.validateScope(user, client, scope);
    const accessToken = await this.generateAccessToken(client, user, scope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();

    const token = {
      accessToken,
      accessTokenExpiresAt,
      scope: validatedScope,
    } as Token;

    return this.model.saveToken(token, client, user);
  }
}
