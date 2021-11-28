'use strict';
/* eslint-disable no-control-regex */

/**
 * Validation rules.
 */

const rules = {
  NCHAR: /^[\u002D\u002E\u005F\w]+$/,
  NQCHAR: /^[\u0021\u0023-\u005B\u005D-\u007E]+$/,
  NQSCHAR: /^[\u0020-\u0021\u0023-\u005B\u005D-\u007E]+$/,
  UNICODECHARNOCRLF: /^[\u0009\u0020-\u007E\u0080-\uD7FF\uE000-\uFFFD]+$/,
  UNICODECHARNOCRLF_EXTENDED: /^[\u{10000}-\u{10FFFF}]+$/u,
  URI: /^[a-zA-Z][a-zA-Z0-9+.-]+:/,
  VSCHAR: /^[\u0020-\u007E]+$/
};

/* eslint-enable no-control-regex */

/**
 * Export validation functions.
 */

module.exports = {

  /**
   * Validate if a value matches a unicode character.
   *
   * @see https://tools.ietf.org/html/rfc6749#appendix-A
   */

  nchar: function(value) {
    return rules.NCHAR.test(value);
  },

  /**
   * Validate if a value matches a unicode character, including exclamation marks.
   *
   * @see https://tools.ietf.org/html/rfc6749#appendix-A
   */

  nqchar: function(value) {
    return rules.NQCHAR.test(value);
  },

  /**
   * Validate if a value matches a unicode character, including exclamation marks and spaces.
   *
   * @see https://tools.ietf.org/html/rfc6749#appendix-A
   */

  nqschar: function(value) {
    return rules.NQSCHAR.test(value);
  },

  /**
   * Validate if a value matches a unicode character excluding the carriage
   * return and linefeed characters.
   *
   * @see https://tools.ietf.org/html/rfc6749#appendix-A
   */

  uchar: function(value) {
    // manually test \u10000-\u10FFFF
    if (rules.UNICODECHARNOCRLF.test(value)) {
      return true;
    }

    return rules.UNICODECHARNOCRLF_EXTENDED.test(value);
  },

  /**
   * Validate if a value matches generic URIs.
   *
   * @see http://tools.ietf.org/html/rfc3986#section-3
   */
  uri: function(value) {
    return rules.URI.test(value);
  },

  /**
   * Validate if a value matches against the printable set of unicode characters.
   *
   * @see https://tools.ietf.org/html/rfc6749#appendix-A
   */

  vschar: function(value) {
    return rules.VSCHAR.test(value);
  }
};
