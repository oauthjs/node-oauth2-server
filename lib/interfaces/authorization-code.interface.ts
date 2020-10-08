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
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain' | null;
  [key: string]: any;
}
