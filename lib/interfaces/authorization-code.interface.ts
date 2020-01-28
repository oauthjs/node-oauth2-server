import { Client, User } from '.';

/**
 * An interface representing the authorization code and associated data.
 */
export interface AuthorizationCode {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  scope?: string;
  client: Client;
  user: User;
  [key: string]: any;
}
