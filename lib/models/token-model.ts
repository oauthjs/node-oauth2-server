import { MS_IN_S } from '../constants';
import { InvalidArgumentError } from '../errors';
import { Client, Token, User } from '../interfaces';
import { hasOwnProperty } from '../utils/fn';

const modelAttributes = [
  'accessToken',
  'accessTokenExpiresAt',
  'client',
  'refreshToken',
  'refreshTokenExpiresAt',
  'scope',
  'user',
];

export class TokenModel implements Token {
  accessToken: string;
  accessTokenExpiresAt?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  client: Client;
  user: User;
  customAttributes: {};
  accessTokenLifetime: number;
  constructor(data: any = {}, options: any = {}) {
    if (!data.accessToken) {
      throw new InvalidArgumentError('Missing parameter: `accessToken`');
    }

    if (!data.client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    if (!data.user) {
      throw new InvalidArgumentError('Missing parameter: `user`');
    }

    if (
      data.accessTokenExpiresAt &&
      !(data.accessTokenExpiresAt instanceof Date)
    ) {
      throw new InvalidArgumentError(
        'Invalid parameter: `accessTokenExpiresAt`',
      );
    }

    if (
      data.refreshTokenExpiresAt &&
      !(data.refreshTokenExpiresAt instanceof Date)
    ) {
      throw new InvalidArgumentError(
        'Invalid parameter: `refreshTokenExpiresAt`',
      );
    }

    this.accessToken = data.accessToken;
    this.accessTokenExpiresAt = data.accessTokenExpiresAt;
    this.client = data.client;
    this.refreshToken = data.refreshToken;
    this.refreshTokenExpiresAt = data.refreshTokenExpiresAt;
    this.scope = data.scope;
    this.user = data.user;

    if (options && options.allowExtendedTokenAttributes) {
      this.customAttributes = {};

      for (const key in data) {
        if (hasOwnProperty(data, key) && modelAttributes.indexOf(key) < 0) {
          this.customAttributes[key] = data[key];
        }
      }
    }

    if (this.accessTokenExpiresAt) {
      this.accessTokenLifetime = Math.floor(
        (this.accessTokenExpiresAt.getTime() - new Date().getTime()) / MS_IN_S,
      );
    }
  }
}
