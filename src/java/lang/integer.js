goog.module('java.lang.Integer');
goog.module.declareLegacyNamespace();

class Integer {
  /**
   * @param {string} value
   */
  constructor(value) {
    this.value_ = parseInt(value, 10);
  }

  /**
   * @param {string} value
   * @param {number=} radix
   * @return {number}
   */
  static parseInt(value, radix = 10) {
    return Number.parseInt(value, radix);
  }

  /**
   * @param {number} i
   * @return {number}
   */
  static bitCount(i) {
    // Copyright: https://github.com/micro-js/popcount
    i -= i >> 1 & 0x55555555;
    i = (i & 0x33333333) + (i >> 2 & 0x33333333);
    i = i + (i >> 4) & 0x0f0f0f0f;
    i += i >> 8;
    i += i >> 16;

    return i & 0x7f;
  }

  /**
   * @param {number} i
   * @return {string}
   */
  static toHexString(i) {
    return i.toString(16);
  }

  /**
   * @param {number} i
   * @return {number}
   */
  static numberOfTrailingZeros(i) {
    let y;
    if (i === 0) {
      return 32;
    }
    let n = 31;
    y = i << 16; if (y !== 0) { n = n - 16; i = y; }
    y = i << 8; if (y !== 0) { n = n - 8; i = y; }
    y = i << 4; if (y !== 0) { n = n - 4; i = y; }
    y = i << 2; if (y !== 0) { n = n - 2; i = y; }
    return n - ((i << 1) >>> 31);
  }
}

/** @const {number} */
Integer.MAX_VALUE = Number.MAX_SAFE_INTEGER;
/** @const {number} */
Integer.MIN_VALUE = Number.MIN_SAFE_INTEGER;

exports = Integer;
