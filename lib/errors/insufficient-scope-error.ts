import { OAuthError } from './oauth-error';

/**
 * Constructor.
 *
 * "The request requires higher privileges than provided by the access token.."
 *
 * @see https://tools.ietf.org/html/rfc6750.html#section-3.1
 */

export class InsufficientScopeError extends OAuthError {
  constructor(message?: string | Error, properties?: any) {
    super(message, { code: 403, name: 'insufficient_scope', ...properties });
  }
}
