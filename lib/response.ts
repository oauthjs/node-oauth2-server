import { hasOwnProperty } from './utils/fn';

export class Response {
  body: any;
  headers: any;
  status: number;
  constructor(options: any = {}) {
    this.body = options.body || {};
    this.headers = {};
    this.status = 200;

    // Store the headers in lower case.
    for (const field in options.headers) {
      if (hasOwnProperty(options.headers, field)) {
        this.headers[field.toLowerCase()] = options.headers[field];
      }
    }

    // Store additional properties of the response object passed in
    for (const property in options) {
      if (hasOwnProperty(options, property) && !this[property]) {
        this[property] = options[property];
      }
    }
  }

  /**
   * Get a response header.
   */

  get(field: string) {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Redirect response.
   */

  redirect(url: string) {
    this.set('Location', url);
    this.status = 302;
  }

  /**
   * Set a response header.
   */

  set(field: string, value: string) {
    this.headers[field.toLowerCase()] = value;
  }
}
