import * as typeis from 'type-is';
import { InvalidArgumentError } from './errors';
import { hasOwnProperty } from './utils/fn';

export class Request {
  body: any;
  headers: any;
  method: string;
  query: any;
  constructor(
    options: {
      body: any;
      headers: any;
      method: string;
      query: any;
      [key: string]: any;
    } = {} as any,
  ) {
    if (!options.headers) {
      throw new InvalidArgumentError('Missing parameter: `headers`');
    }

    if (!options.method) {
      throw new InvalidArgumentError('Missing parameter: `method`');
    }

    if (typeof options.method !== 'string') {
      throw new InvalidArgumentError('Invalid parameter: `method`');
    }

    if (!options.query) {
      throw new InvalidArgumentError('Missing parameter: `query`');
    }

    this.body = options.body || {};
    this.headers = {};
    this.method = options.method.toUpperCase();
    this.query = options.query;

    // Store the headers in lower case.
    for (const field of Object.keys(options.headers)) {
      if (hasOwnProperty(options.headers, field)) {
        this.headers[field.toLowerCase()] = options.headers[field];
      }
    }

    // Store additional properties of the request object passed in
    for (const property of Object.keys(options)) {
      if (hasOwnProperty(options, property) && !this[property]) {
        this[property] = options[property];
      }
    }
  }

  /**
   * Get a request header.
   */

  get(field: string) {
    return this.headers[field.toLowerCase()];
  }

  /**
   * Check if the content-type matches any of the given mime type.
   */
  public is(args: string[]): string | false;
  public is(...args: string[]): string | false;

  is(...args) {
    let types = args;
    if (Array.isArray(types[0])) {
      types = types[0];
    }

    return typeis(this as any, types) || false;
  }
}
