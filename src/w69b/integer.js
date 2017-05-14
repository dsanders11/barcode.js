goog.provide('w69b.Integer');


goog.scope(function() {
  /**
   * @constructor
   * @param {string} value
   */
  w69b.Integer = function(value) {
    this.value_ = parseInt(value, 10);
  };
  const Integer = w69b.Integer;

  /** @const {number} */
  Integer.MAX_VALUE = Number.MAX_SAFE_INTEGER;
  /** @const {number} */
  Integer.MIN_VALUE = Number.MIN_SAFE_INTEGER;

  /**
   * @param {string} value
   * @param {number=} radix
   * @return {number}
   */
  Integer.parseInt = function(value, radix = 10) {
    return Number.parseInt(value, radix);
  };

  /**
   * @param {number} i
   * @return {number}
   */
  Integer.bitCount = function(i) {
    // Copyright: https://github.com/micro-js/popcount
    i -= i >> 1 & 0x55555555;
    i = (i & 0x33333333) + (i >> 2 & 0x33333333);
    i = i + (i >> 4) & 0x0f0f0f0f;
    i += i >> 8;
    i += i >> 16;

    return i & 0x7f;
  };

  /**
   * @param {number} i
   * @return {string}
   */
  Integer.toHexString = function(i) {
    return i.toString(16);
  };

  /**
   * @param {number} i
   * @return {number}
   */
  Integer.numberOfTrailingZeros = function(i) {
    var y;
    if (i === 0) {
      return 32;
    }
    var n = 31;
    y = i << 16; if (y !== 0) { n = n - 16; i = y; }
    y = i << 8; if (y !== 0) { n = n - 8; i = y; }
    y = i << 4; if (y !== 0) { n = n - 4; i = y; }
    y = i << 2; if (y !== 0) { n = n - 2; i = y; }
    return n - ((i << 1) >>> 31);
  };
});
