// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2010 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('w69b.oned.Code128Writer');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.exceptions.IllegalArgumentException');
goog.require('w69b.oned.Code128Reader');
goog.require('w69b.oned.OneDimensionalCodeWriter');


goog.scope(function() {
  var BarcodeFormat = w69b.BarcodeFormat;
  var IllegalArgumentException = w69b.exceptions.IllegalArgumentException;
  var Code128Reader = w69b.oned.Code128Reader;
  var OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;

  /**
   * This object renders a CODE128 code as a BitMatrix.
   * @constructor
   * @extends {OneDimensionalCodeWriter}
   * @final
   */
  w69b.oned.Code128Writer = function() { };
  var Code128Writer = w69b.oned.Code128Writer;
  goog.inherits(Code128Writer, OneDimensionalCodeWriter);
  var pro = Code128Writer.prototype;

  /** @const {number} */
  var CODE_START_B = 104;
  /** @const {number} */
  var CODE_START_C = 105;
  /** @const {number} */
  var CODE_CODE_B = 100;
  /** @const {number} */
  var CODE_CODE_C = 99;
  /** @const {number} */
  var CODE_STOP = 106;

  // Dummy characters used to specify control characters in input
  /** @const {string} */
  var ESCAPE_FNC_1 = '\u00f1';
  /** @const {string} */
  var ESCAPE_FNC_2 = '\u00f2';
  /** @const {string} */
  var ESCAPE_FNC_3 = '\u00f3';
  /** @const {string} */
  var ESCAPE_FNC_4 = '\u00f4';

  /** @const {number} */
  var CODE_FNC_1 = 102;   // Code A, Code B, Code C
  /** @const {number} */
  var CODE_FNC_2 = 97;    // Code A, Code B
  /** @const {number} */
  var CODE_FNC_3 = 96;    // Code A, Code B
  /** @const {number} */
  var CODE_FNC_4_B = 100; // Code B

  /**
   * Results of minimal lookahead for code C
   * @enum {number}
   */
  var CType = {
    UNCODABLE: 0,
    ONE_DIGIT: 1,
    TWO_DIGITS: 2,
    FNC_1: 3
  };

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format != BarcodeFormat.CODE_128) {
      throw new IllegalArgumentException("Can only encode CODE_128, but got " + format);
    }

    return goog.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    var length = contents.length;
    // Check length
    if (length < 1 || length > 80) {
      throw new IllegalArgumentException(
          "Contents length should be between 1 and 80 characters, but got " + length);
    }
    // Check content
    for (let i = 0; i < length; i++) {
      let c = contents.charAt(i);
      if (c < ' ' || c > '~') {
        switch (c) {
          case ESCAPE_FNC_1:
          case ESCAPE_FNC_2:
          case ESCAPE_FNC_3:
          case ESCAPE_FNC_4:
            break;
          default:
            throw new IllegalArgumentException("Bad character in input: " + c);
        }
      }
    }

    /** @type {Array.<!Int32Array>} */
    var patterns = []; // temporary storage for patterns
    var checkSum = 0;
    var checkWeight = 1;
    var codeSet = 0; // selected code (CODE_CODE_B or CODE_CODE_C)
    var position = 0; // position in contents

    while (position < length) {
      //Select code to use
      let newCodeSet = chooseCode(contents, position, codeSet);

      //Get the pattern index
      let patternIndex;
      if (newCodeSet === codeSet) {
        // Encode the current character
        // First handle escapes
        switch (contents.charAt(position)) {
          case ESCAPE_FNC_1:
            patternIndex = CODE_FNC_1;
            break;
          case ESCAPE_FNC_2:
            patternIndex = CODE_FNC_2;
            break;
          case ESCAPE_FNC_3:
            patternIndex = CODE_FNC_3;
            break;
          case ESCAPE_FNC_4:
            patternIndex = CODE_FNC_4_B; // FIXME if this ever outputs Code A
            break;
          default:
            // Then handle normal characters otherwise
            if (codeSet === CODE_CODE_B) {
              patternIndex = contents.charCodeAt(position) - ' '.charCodeAt(0);
            } else { // CODE_CODE_C
              patternIndex = parseInt(contents.substring(position, position + 2), 10);
              position++; // Also incremented below
            }
        }
        position++;
      } else {
        // Should we change the current code?
        // Do we have a code set?
        if (codeSet === 0) {
          // No, we don't have a code set
          if (newCodeSet === CODE_CODE_B) {
            patternIndex = CODE_START_B;
          } else {
            // CODE_CODE_C
            patternIndex = CODE_START_C;
          }
        } else {
          // Yes, we have a code set
          patternIndex = newCodeSet;
        }
        codeSet = newCodeSet;
      }

      // Get the pattern
      patterns.push(Code128Reader.CODE_PATTERNS[patternIndex]);

      // Compute checksum
      checkSum += patternIndex * checkWeight;
      if (position !== 0) {
        checkWeight++;
      }
    }

    // Compute and append checksum
    checkSum %= 103;
    patterns.push(Code128Reader.CODE_PATTERNS[checkSum]);

    // Append stop code
    patterns.push(Code128Reader.CODE_PATTERNS[CODE_STOP]);

    // Compute code width
    var codeWidth = 0;
    for (let pattern of patterns) {
      for (let width of pattern) {
        codeWidth += width;
      }
    }

    // Compute result
    /** @type {Array.<boolean>} */
    var result = new Array(codeWidth);
    var pos = 0;
    for (let pattern of patterns) {
      pos += OneDimensionalCodeWriter.appendPattern(result, pos, pattern, true);
    }

    return result;
  };

  /**
   * @param {string} value
   * @param {number} start
   * @return {CType}
   * @private
   */
  function findCType(value, start) {
    var last = value.length;
    if (start >= last) {
      return CType.UNCODABLE;
    }
    var c = value.charAt(start);
    if (c == ESCAPE_FNC_1) {
      return CType.FNC_1;
    }
    if (c < '0' || c > '9') {
      return CType.UNCODABLE;
    }
    if (start + 1 >= last) {
      return CType.ONE_DIGIT;
    }
    c = value.charAt(start + 1);
    if (c < '0' || c > '9') {
      return CType.ONE_DIGIT;
    }
    return CType.TWO_DIGITS;
  }

  /**
   * @param {string} value
   * @param {number} start
   * @param {number} oldCode
   * @return {number}
   * @private
   */
  function chooseCode(value, start, oldCode) {
    var lookahead = findCType(value, start);
    if (lookahead === CType.UNCODABLE || lookahead === CType.ONE_DIGIT) {
      return CODE_CODE_B; // no choice
    }
    if (oldCode === CODE_CODE_C) { // can continue in code C
      return CODE_CODE_C;
    }
    if (oldCode === CODE_CODE_B) {
      if (lookahead === CType.FNC_1) {
        return CODE_CODE_B; // can continue in code B
      }
      // Seen two consecutive digits, see what follows
      lookahead = findCType(value, start + 2);
      if (lookahead === CType.UNCODABLE || lookahead === CType.ONE_DIGIT) {
        return CODE_CODE_B; // not worth switching now
      }
      if (lookahead === CType.FNC_1) { // two digits, then FNC_1...
        lookahead = findCType(value, start + 3);
        if (lookahead === CType.TWO_DIGITS) { // then two more digits, switch
          return CODE_CODE_C;
        } else {
          return CODE_CODE_B; // otherwise not worth switching
        }
      }
      // At this point, there are at least 4 consecutive digits.
      // Look ahead to choose whether to switch now or on the next round.
      let index = start + 4;
      while ((lookahead = findCType(value, index)) === CType.TWO_DIGITS) {
        index += 2;
      }
      if (lookahead === CType.ONE_DIGIT) { // odd number of digits, switch later
        return CODE_CODE_B;
      }
      return CODE_CODE_C; // even number of digits, switch now
    }
    // Here oldCode == 0, which means we are choosing the initial code
    if (lookahead === CType.FNC_1) { // ignore FNC_1
      lookahead = findCType(value, start + 1);
    }
    if (lookahead === CType.TWO_DIGITS) { // at least two digits, start in code C
      return CODE_CODE_C;
    }
    return CODE_CODE_B;
  }
});
