// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2008 ZXing authors
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

goog.provide('w69b.oned.Code39Reader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.ChecksumException');
goog.require('w69b.FormatException');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitArray');
goog.require('w69b.oned.OneDReader');


goog.scope(function() {
  var BarcodeFormat = w69b.BarcodeFormat;
  var ChecksumException = w69b.ChecksumException;
  var FormatException = w69b.FormatException;
  var NotFoundException = w69b.NotFoundException;
  var Result = w69b.Result;
  var ResultPoint = w69b.ResultPoint;
  var BitArray = w69b.common.BitArray;
  var OneDReader = w69b.oned.OneDReader;

  /**
   * Decodes Code 39 barcodes. This does not support "Full ASCII Code 39" yet.
   *
   * Creates a reader that assumes all encoded data is data, and does not treat
   * the final character as a check digit. It will not decoded "extended Code 39"
   * sequences.
   *
   * Creates a reader that can be configured to check the last character as a
   * check digit. It will not decoded "extended Code 39" sequences.
   *
   * Creates a reader that can be configured to check the last character as a
   * check digit, or optionally attempt to decode "extended Code 39" sequences
   * that are used to encode the full ASCII character set.
   *
   * @constructor
   * @param {boolean=} opt_usingCheckDigit if true, treat the last data character as a check digit, not
   * data, and verify that the checksum passes.
   * @param {boolean=} opt_extendedMode if true, will attempt to decode extended Code 39 sequences in the
   * text.
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.Code39Reader = function(opt_usingCheckDigit, opt_extendedMode) {
    this.usingCheckDigit_ = opt_usingCheckDigit ? true : false;
    this.extendedMode_ = opt_extendedMode ? true : false;
    // TODO - Determine how this behavior might have changed in porting code
    //decodeRowResult = new StringBuilder(20);
    /** @type {Array.<number>} */
    this.counters_ = new Array(9);
  };
  var Code39Reader = w69b.oned.Code39Reader;
  goog.inherits(Code39Reader, OneDReader);
  var pro = Code39Reader.prototype;

  /** @final */
  Code39Reader.ALPHABET_STRING = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. *$/+%";

  /**
   * Note this lacks '*' compared to ALPHABET_STRING
   * @private
   * @final
   */
  Code39Reader.CHECK_DIGIT_STRING = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";

  /**
   * These represent the encodings of characters, as patterns of wide and narrow
   * bars. The 9 least-significant bits of each int correspond to the pattern of
   * wide and narrow, with 1s representing "wide" and 0s representing narrow.
   * @type {Array.<number>}
   * @final
   */
  Code39Reader.CHARACTER_ENCODINGS = [
    0x034, 0x121, 0x061, 0x160, 0x031, 0x130, 0x070, 0x025, 0x124, 0x064, // 0-9
    0x109, 0x049, 0x148, 0x019, 0x118, 0x058, 0x00D, 0x10C, 0x04C, 0x01C, // A-J
    0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106, 0x046, 0x016, // K-T
    0x181, 0x0C1, 0x1C0, 0x091, 0x190, 0x0D0, 0x085, 0x184, 0x0C4, 0x094, // U-*
    0x0A8, 0x0A2, 0x08A, 0x02A // $-%
  ];

  /** @final */
  Code39Reader.ASTERISK_ENCODING = Code39Reader.CHARACTER_ENCODINGS[39];

  /**
   * For efficiency, returns -1 on failure. Not throwing here saved as many as
   * 700 exceptions per image when using some of our blackbox images.
   * @param {Array.<number>} counters
   * @return {number}
   * @private
   */
  Code39Reader.toNarrowWidePattern_ = function(counters) {
    var numCounters = counters.length;
    var maxNarrowCounter = 0;
    var wideCounters;
    do {
      var minCounter = Number.MAX_VALUE;
      for (var counter of counters) {
        if (counter < minCounter && counter > maxNarrowCounter) {
          minCounter = counter;
        }
      }
      maxNarrowCounter = minCounter;
      wideCounters = 0;
      var totalWideCountersWidth = 0;
      var pattern = 0;
      for (var i = 0; i < numCounters; i++) {
        var counter = counters[i];
        if (counter > maxNarrowCounter) {
          pattern |= 1 << (numCounters - 1 - i);
          wideCounters++;
          totalWideCountersWidth += counter;
        }
      }
      if (wideCounters == 3) {
        // Found 3 wide counters, but are they close enough in width?
        // We can perform a cheap, conservative check to see if any individual
        // counter is more than 1.5 times the average:
        for (var i = 0; i < numCounters && wideCounters > 0; i++) {
          var counter = counters[i];
          if (counter > maxNarrowCounter) {
            wideCounters--;
            // totalWideCountersWidth = 3 * average, so this checks if counter >= 3/2 * average
            if ((counter * 2) >= totalWideCountersWidth) {
              return -1;
            }
          }
        }
        return pattern;
      }
    } while (wideCounters > 3);
    return -1;
  };

  /**
   * @override
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    var theCounters = this.counters_;
    theCounters.fill(0);
    var result = '';
    //StringBuilder result = decodeRowResult;
    //result.setLength(0);

    var start = Code39Reader.findAsteriskPattern_(row, theCounters);
    // Read off white space
    var nextStart = row.getNextSet(start[1]);
    var end = row.getSize();

    var decodedChar;
    var lastStart;
    do {
      OneDReader.recordPattern(row, nextStart, theCounters);
      var pattern = Code39Reader.toNarrowWidePattern_(theCounters);
      if (pattern < 0) {
        throw new NotFoundException();
      }
      decodedChar = Code39Reader.patternToChar_(pattern);
      result += decodedChar;
      lastStart = nextStart;
      for (var counter of theCounters) {
        nextStart += counter;
      }
      // Read off white space
      nextStart = row.getNextSet(nextStart);
    } while (decodedChar != '*');
    result = result.slice(0, -1); // remove asterisk

    // Look for whitespace after pattern:
    var lastPatternSize = 0;
    for (var counter of theCounters) {
      lastPatternSize += counter;
    }
    var whiteSpaceAfterEnd = nextStart - lastStart - lastPatternSize;
    // If 50% of last pattern size, following last pattern, is not whitespace, fail
    // (but if it's whitespace to the very end of the image, that's OK)
    if (nextStart != end && (whiteSpaceAfterEnd * 2) < lastPatternSize) {
      throw new NotFoundException();
    }

    if (this.usingCheckDigit_) {
      var max = result.length - 1;
      var total = 0;
      for (var i = 0; i < max; i++) {
        total += Code39Reader.CHECK_DIGIT_STRING.indexOf(result.charAt(i));
      }
      if (result.charAt(max) != Code39Reader.CHECK_DIGIT_STRING.charAt(total % 43)) {
        throw new ChecksumException();
      }
      result = result.slice(0, max);
    }

    if (result.length === 0) {
      // false positive
      throw new NotFoundException();
    }

    var resultString;
    if (this.extendedMode_) {
      resultString = Code39Reader.decodeExtended_(result);
    } else {
      resultString = result;
    }

    var left = (start[1] + start[0]) / 2.0;
    var right = lastStart + lastPatternSize / 2.0;
    return new Result(
        resultString,
        null,
        [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)],
        BarcodeFormat.CODE_39);
  };

  /**
   * @param {BitArray} row
   * @param {Array.<number>} counters
   * @return {Array.<number>}
   * @throws {NotFoundException}
   * @private
   */
  Code39Reader.findAsteriskPattern_ = function(row, counters) {
    var width = row.getSize();
    var rowOffset = row.getNextSet(0);

    var counterPosition = 0;
    var patternStart = rowOffset;
    var isWhite = false;
    var patternLength = counters.length;

    for (var i = rowOffset; i < width; i++) {
      if (row.get(i) ^ isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition == patternLength - 1) {
          // Look for whitespace before start pattern, >= 50% of width of start pattern
          if (Code39Reader.toNarrowWidePattern_(counters) == Code39Reader.ASTERISK_ENCODING &&
              row.isRange(Math.max(0, patternStart - ((i - patternStart) / 2)), patternStart, false)) {
            return [patternStart, i];
          }
          patternStart += counters[0] + counters[1];
          //System.arraycopy(counters, 2, counters, 0, patternLength - 2);
          counters.copyWithin(0, 2, patternLength - 2);
          counters[patternLength - 2] = 0;
          counters[patternLength - 1] = 0;
          counterPosition--;
        } else {
          counterPosition++;
        }
        counters[counterPosition] = 1;
        isWhite = !isWhite;
      }
    }
    throw new NotFoundException();
  };

  /**
   * @param {string} encoded
   * @return {string}
   * @throws {FormatException}
   * @private
   */
  Code39Reader.decodeExtended_ = function(encoded) {
    var length = encoded.length;
    var decoded = '';
    for (var i = 0; i < length; i++) {
      var c = encoded.charAt(i);
      if (c == '+' || c == '$' || c == '%' || c == '/') {
        var next = encoded.charAt(i + 1);
        var decodedChar = '\0';
        switch (c) {
          case '+':
            // +A to +Z map to a to z
            if (next >= 'A' && next <= 'Z') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) + 32);
            } else {
              throw new FormatException();
            }
            break;
          case '$':
            // $A to $Z map to control codes SH to SB
            if (next >= 'A' && next <= 'Z') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 64);
            } else {
              throw new FormatException();
            }
            break;
          case '%':
            // %A to %E map to control codes ESC to US
            if (next >= 'A' && next <= 'E') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 38);
            } else if (next >= 'F' && next <= 'W') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 11);
            } else {
              throw new FormatException();
            }
            break;
          case '/':
            // /A to /O map to ! to , and /Z maps to :
            if (next >= 'A' && next <= 'O') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 32);
            } else if (next == 'Z') {
              decodedChar = ':';
            } else {
              throw new FormatException();
            }
            break;
        }
        decoded += decodedChar;
        // bump up i again since we read two characters
        i++;
      } else {
        decoded += c;
      }
    }
    return decoded;
  };

  /**
   * @param {number} pattern
   * @returns {string}
   * @throws {NotFoundException}
   * @private
   */
  Code39Reader.patternToChar_ = function(pattern) {
    for (var i = 0; i < Code39Reader.CHARACTER_ENCODINGS.length; i++) {
      if (Code39Reader.CHARACTER_ENCODINGS[i] === pattern) {
        return Code39Reader.ALPHABET_STRING.charAt(i);
      }
    }
    throw new NotFoundException();
  };
});
