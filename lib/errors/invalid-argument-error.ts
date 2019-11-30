import { OAuthError } from './oauth-error';
/**
 * Constructor.
 *
 * "The request requires valid argument."
 *
 */
export class InvalidArgumentError extends OAuthError {
  constructor(message: string | Error = '', properties?: any) {
    super(message, { code: 500, name: 'invalid_argument', ...properties });
  }
}
