import { parse } from 'url';
import { InvalidArgumentError } from '../errors/invalid-argument-error';

export class CodeResponseType {
  code: any;
  constructor(code: number) {
    if (!code) {
      throw new InvalidArgumentError('Missing parameter: `code`');
    }
    this.code = code;
  }

  /**
   * Build redirect uri.
   */

  buildRedirectUri(redirectUri: string) {
    if (!redirectUri) {
      throw new InvalidArgumentError('Missing parameter: `redirectUri`');
    }

    const uri = parse(redirectUri, true);

    uri.query.code = this.code;
    uri.search = undefined;

    return uri;
  }
}
