goog.provide('w69b.utf8');
/**
 * @license
 * utf8.js
 * License: Apache2, v2 see http://www.apache.org/licenses/LICENSE-2.0
 * @author mb@w69b.com (Manuel Braun)
 */
(function(global) {
  /**
   * @param {string} str
   * @param {number} idx
   * @return {number}
   * @license Snippet fixedCharCodeAt borrowed from http://goo.gl/3lRpR.
   * (c) see contributers of site.
   * License: MIT
   */
  function fixedCharCodeAt(str, idx) {
      const code = str.charCodeAt(idx);
      let hi, low;
      // High surrogate (could change last hex to 0xDB7F to treat high private
      // surrogates as single characters)
      if (0xD800 <= code && code <= 0xDBFF) {
          hi = code;
          low = str.charCodeAt(idx + 1);
          if (isNaN(low)) {
            throw 'fixedCharCodeAt: Invalid Encoding';
          }
          return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
      }
      // We return 0 to allow loops to skip this iteration since should
      // have already handled high surrogate above in the previous iteration
      // Low surrogate
      if (0xDC00 <= code && code <= 0xDFFF) {
          return 0;
      }
      return code;
  }

  /**
   * fixedFromCodePoint
   * Convert array of unicode code points to string.
   * @param {!Array.<number>} codePoints codePoints sequence.
   * @return {string} resulting string.
   * @license Originally from ES6 Unicode Shims 0.1
   * (c) 2012 Steven Levithan <http://slevithan.com/>
   * MIT License
   */
  function fixedFromCodePoint(codePoints) {
    let chars = [], point, offset, units, i;
    for (i = 0; i < codePoints.length; ++i) {
      point = codePoints[i];
      offset = point - 0x10000;
      units = point > 0xFFFF ?
        [0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF)] : [point];
      chars.push(String.fromCharCode.apply(null, units));
    }
    return chars.join('');
  }

  /**
   * Convert string to UTF8 byte sequence.
   * @param {string} str javascript string (unicode).
   * @return {!Int8Array} byte sequence.
   */
  function stringToUTF8Bytes(str) {
    /** @type {!Array.<number>} */
    const bytes = [];
    for (let i = 0; i < str.length; ++i) {
      const codePoint = fixedCharCodeAt(str, i);
      // already handeled
      if (!codePoint) continue;
      if (codePoint <= 0x7F) {
        bytes.push(codePoint);
      } else if (codePoint <= 0x07FF) {
        bytes.push(0xC0 | (codePoint >> 6));
        bytes.push(0x80 | (codePoint & 0x3F));
      } else if (codePoint <= 0xFFFF) {
        bytes.push(0xE0 | (codePoint >> 12));
        bytes.push(0x80 | (0x3F & (codePoint >> 6)));
        bytes.push(0x80 | (codePoint & 0x3F));
      } else if (codePoint <= 0x1FFFFF) {
        bytes.push(0xF0 | (codePoint >> 18));
        bytes.push(0x80 | (0x3F & (codePoint >> 12)));
        bytes.push(0x80 | (0x3F & (codePoint >> 6)));
        bytes.push(0x80 | (codePoint & 0x3F));
      } else if (codePoint <= 0x3FFFFFF) {
        bytes.push(0xF0 | (codePoint >> 24));
        bytes.push(0x80 | (0x3F & (codePoint >> 18)));
        bytes.push(0x80 | (0x3F & (codePoint >> 12)));
        bytes.push(0x80 | (0x3F & (codePoint >> 6)));
        bytes.push(0x80 | (codePoint & 0x3F));
      } else {
        bytes.push(0xF0 | (0x01 & (codePoint >> 30)));
        bytes.push(0x80 | (0x3F & (codePoint >> 24)));
        bytes.push(0x80 | (0x3F & (codePoint >> 18)));
        bytes.push(0x80 | (0x3F & (codePoint >> 12)));
        bytes.push(0x80 | (0x3F & (codePoint >> 6)));
        bytes.push(0x80 | (codePoint & 0x3F));
      }
    }
    return new Int8Array(bytes);
  }

  /**
   * Convert UTF8 byte sequence to string.
   * @param {!Int8Array} bytes UTF8 byte sequence.
   * @return {?string} result string or null on error (invalid input).
   */
  function UTF8BytesToString(bytes) {
    const length = bytes.length;

    /**
     * @param {number} idx
     * @return {number}
     */
    const getContinuation = function(idx) {
      if (idx > length) throw new Error();
      const b = bytes[idx];
      if ((b & 0xC0) !== 0x80) throw new Error();
      return b & 0x3F;
    };
    const codePoints = [];
    try {
      for (let i = 0; i < length; ++i) {
        const b = bytes[i];
        if (b > 0xFF) return null;
        let code;
        if ((b & 0x80) === 0x00) {
          // First bit not set, so it is a 1-byte char.
          code = b;
        } else if ((b & 0xE0) === 0xC0) {
          // 2 bytes.
          code = ((0x1F & b) << 6) | getContinuation(i + 1);
          i += 1;
        } else if ((b & 0xF0) === 0xE0) {
          // 3 bytes.
          code = ((0x0F & b) << 12) |
            (getContinuation(i + 1) << 6) |
            getContinuation(i + 2);
          i += 2;
        } else if ((b & 0xF8) === 0xF0) {
          // 4 bytes.
          code = ((0x07 & b) << 18) |
            (getContinuation(i + 1) << 12) |
            (getContinuation(i + 2) << 6) |
            getContinuation(i + 3);
          i += 3;
        } else if ((b & 0xFC) === 0xF8) {
          // 5 bytes.
          code = ((0x03 & b) << 24) |
            (getContinuation(i + 1) << 18) |
            (getContinuation(i + 2) << 12) |
            (getContinuation(i + 3) << 6) |
            getContinuation(i + 4);
          i += 4;
        } else if ((b & 0xFE) === 0xFC) {
          // 6 bytes.
          code = ((0x01 & b) << 30) |
            (getContinuation(i + 1) << 24) |
            (getContinuation(i + 2) << 18) |
            (getContinuation(i + 3) << 12) |
            (getContinuation(i + 4) << 6) |
            getContinuation(i + 5);
          i += 5;
        }
        codePoints.push(code);
      }
    } catch (ignored) {
      // Our invalid-incoding exception is the only one thrown
      // this block, so just return null.
      return null;
    }
    return fixedFromCodePoint(codePoints);
  }

  // Public API.
  const exports = {
    stringToUTF8Bytes: stringToUTF8Bytes,
    UTF8BytesToString: UTF8BytesToString
  };

  if (typeof(goog) == 'object' && goog.provide) {
    // Google Closure Tools compatibility hook.
    w69b.utf8.stringToUTF8Bytes = stringToUTF8Bytes;
    w69b.utf8.UTF8BytesToString = UTF8BytesToString;
  } else if (typeof(global.define) == 'function') {
    // require js compatibility hook.
    global.define(exports);
  } else {
    // Plain old global export fallback.
    global['utf8'] = exports;
  }
})(self);
