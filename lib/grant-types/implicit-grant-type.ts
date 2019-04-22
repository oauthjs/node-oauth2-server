import { AbstractGrantType } from '.';
import { InvalidArgumentError } from '../errors';
import { Client, User } from '../interfaces';
import { Token } from '../interfaces/token.interface';
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
    const fns = [
      this.validateScope(user, client, scope),
      this.generateAccessToken(client, user, scope),
      this.getAccessTokenExpiresAt(),
    ];

    const [
      validatedScope,
      accessToken,
      accessTokenExpiresAt,
    ] = await Promise.all(fns as any);

    const token = {
      accessToken,
      accessTokenExpiresAt,
      scope: validatedScope,
    } as Token;

    return this.model.saveToken(token, client, user);
  }
}
