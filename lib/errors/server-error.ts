import { OAuthError } from './oauth-error';

/**
 * ServerError
 *
 * "The authorization server encountered an unexpected condition that prevented it from fulfilling the request."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export class ServerError extends OAuthError {
  constructor(message?: string | Error, properties?: any) {
    super(message, { code: 500, name: 'server_error', ...properties });
  }
}
