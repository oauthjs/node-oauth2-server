var is = require('../../../lib/validator/is');
require('chai').should();

function runRanges (ranges, fn, expected) {
  ranges.forEach(function (range) {
    var lower = range[0];
    var upper = range[1];

    for (var i = lower; i <= upper; i++) {
      var unicodeChar =  String.fromCodePoint(i);
      // single char
      fn(unicodeChar).should.eql(expected, i + ' ' + unicodeChar);
      // multiple chars
      fn(unicodeChar+unicodeChar).should.eql(expected, i + ' ' + unicodeChar);
    }
  });
}

describe('Validator', function () {
  describe('is', function () {
    it('validates if a value matches a unicode character (nchar)', function () {
      var validRanges = [
        [45, 46], // \u002D \u002E
        [48, 57], // 0-9
        [65, 90], // A-Z
        [95, 95], // \u005F
        [97, 122] // a-z
      ];

      runRanges(validRanges, is.nchar, true);

      var invalidRanges = [
        [0, 44],
        [47, 47],
        [58, 64],
        [91, 94],
        [96, 96],
        [123, 1023]
      ];

      runRanges(invalidRanges, is.nchar, false);
    });
    it('validates if a value matches a unicode character, including exclamation marks (nqchar)', function () {
      var validRanges = [
        [33, 33], // \u0021
        [35, 91], // \u0023-\u005B
        [93, 126] // \u005D-\u007E
      ];

      runRanges(validRanges, is.nqchar, true);

      var invalidRanges = [
        [0, 32],
        [34, 34],
        [92, 92],
        [127, 1023]
      ];

      runRanges(invalidRanges, is.nqchar, false);
    });
    it('validates if a value matches a unicode character, including exclamation marks and spaces (nqschar)', function () {
      var validRanges = [
        [32, 33], // \u0020-\u0021
        [35, 91], // \u0023-\u005B
        [93, 126] // \u005D-\u007E
      ];

      runRanges(validRanges, is.nqschar, true);

      var invalidRanges = [
        [0, 31],
        [34, 34],
        [92, 92],
        [127, 1023]
      ];

      runRanges(invalidRanges, is.nqschar, false);
    });
    it('validates if a value matches a unicode character excluding the carriage return and linefeed characters (uchar)', function () {
      this.timeout(60000);
      var validRanges = [
        [9, 9], // \u0009
        [32, 126], // \u0020-\u007E,
        [128, 55295], // \u0080-\uD7FF
        [57344, 65533], // \uE000-\uFFFD
        [65536, 1114111] // \u10000-\u10FFFF
      ];

      runRanges(validRanges, is.uchar, true);

      var invalidRanges = [
        [0, 8],
        [10, 31],
        [127, 127],
        [55296, 57343],
        [65534, 65535]
      ];

      runRanges(invalidRanges, is.uchar, false);
    });
    it('validates if a value matches generic URIs (uri)', function () {
      ['aa:', 'http:', 'https:'].forEach(function (uri) {
        is.uri(uri).should.equal(true);
        is.uri(uri.toUpperCase()).should.equal(true);
      });

      ['a', 'a:', 'http'].forEach(function (uri) {
        is.uri(uri).should.equal(false);
        is.uri(uri.toUpperCase()).should.equal(false);
      });
    });
    it('validates if a value matches against the printable set of unicode characters (vschar)', function () {
      var validRanges = [
        [32, 126] // \u0020-\u007E
      ];

      runRanges(validRanges, is.vschar, true);

      var invalidRanges = [
        [0, 31],
        [127, 1023]
      ];

      runRanges(invalidRanges, is.vschar, false);
    });
  });
});
