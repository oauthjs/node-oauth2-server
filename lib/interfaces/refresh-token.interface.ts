import { Client } from './client.interface';
import { User } from './user.interface';

/**
 * An interface representing the refresh token and associated data.
 */
export interface RefreshToken {
  refreshToken: string;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  client: Client;
  user: User;
  [key: string]: any;
}
