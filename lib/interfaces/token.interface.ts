import { Client, User } from '.';

/**
 * An interface representing the token(s) and associated data.
 */
export interface Token {
  accessToken: string;
  accessTokenExpiresAt?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  client: Client;
  user: User;
  [key: string]: any;
}
