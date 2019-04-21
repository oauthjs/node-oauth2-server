import { OAuthError } from './oauth-error';

/**
 * Constructor.
 *
 * "The provided authorization grant (e.g., authorization code, resource owner credentials)
 * or refresh token is invalid, expired, revoked, does not match the redirection URI used
 * in the authorization request, or was issued to another client."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
 */

export class InvalidGrantError extends OAuthError {
  constructor(message?: string | Error, properties?: any) {
    super(message, { code: 400, name: 'invalid_grant', ...properties });
  }
}
