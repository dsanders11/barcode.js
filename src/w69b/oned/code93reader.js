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

goog.provide('w69b.oned.Code93Reader');
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
   * Decodes Code 93 barcodes.
   *
   * @constructor
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.Code93Reader = function() {
    this.counters_ = new Int32Array(6);
  };
  var Code93Reader = w69b.oned.Code93Reader;
  goog.inherits(Code93Reader, OneDReader);
  var pro = Code93Reader.prototype;

  /**
   * Note that 'abcd' are dummy characters in place of control characters.
   * @const {string}
   */
  Code93Reader.ALPHABET_STRING = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*";
  Code93Reader.ALPHABET = Code93Reader.ALPHABET_STRING.split('');

  /**
   * These represent the encodings of characters, as patterns of wide and
   * narrow bars. The 9 least-significant bits of each int correspond to the
   * pattern of wide and narrow.
   * @const {!Int32Array}
   */
  Code93Reader.CHARACTER_ENCODINGS = Int32Array.of(
    0x114, 0x148, 0x144, 0x142, 0x128, 0x124, 0x122, 0x150, 0x112, 0x10A, // 0-9
    0x1A8, 0x1A4, 0x1A2, 0x194, 0x192, 0x18A, 0x168, 0x164, 0x162, 0x134, // A-J
    0x11A, 0x158, 0x14C, 0x146, 0x12C, 0x116, 0x1B4, 0x1B2, 0x1AC, 0x1A6, // K-T
    0x196, 0x19A, 0x16C, 0x166, 0x136, 0x13A, // U-Z
    0x12E, 0x1D4, 0x1D2, 0x1CA, 0x16E, 0x176, 0x1AE, // - - %
    0x126, 0x1DA, 0x1D6, 0x132, 0x15E // Control chars? $-*
  );

  /** @const {number} */
  Code93Reader.ASTERISK_ENCODING = Code93Reader.CHARACTER_ENCODINGS[47];

  /**
   * @override
   * @suppress {checkTypes}
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    var start = this.findAsteriskPattern_(row);
    // Read off white space
    var nextStart = row.getNextSet(start[1]);
    var end = row.getSize();

    var theCounters = this.counters_;
    theCounters.fill(0);
    var result = '';

    var decodedChar;
    var lastStart;
    do {
      OneDReader.recordPattern(row, nextStart, theCounters);
      let pattern = toPattern(theCounters);
      if (pattern < 0) {
        throw new NotFoundException();
      }
      decodedChar = Code93Reader.patternToChar_(pattern);
      result += decodedChar;
      lastStart = nextStart;
      for (let counter of theCounters) {
        nextStart += counter;
      }
      // Read off white space
      nextStart = row.getNextSet(nextStart);
    } while (decodedChar !== '*');
    result = result.slice(0, -1); // remove asterisk

    var lastPatternSize = 0;
    for (let counter of theCounters) {
      lastPatternSize += counter;
    }

    // Should be at least one more black module
    if (nextStart === end || !row.get(nextStart)) {
      throw new NotFoundException();
    }

    if (result.length < 2) {
      // false positive -- need at least 2 checksum digits
      throw new NotFoundException();
    }

    checkChecksums(result);
    // Remove checksum digits
    result = result.slice(0, -2);

    var resultString = Code93Reader.decodeExtended_(result);

    var left = (start[1] + start[0]) / 2.0;
    var right = lastStart + lastPatternSize / 2.0;
    return new Result(
        resultString,
        null,
        [new ResultPoint(left, rowNumber),
         new ResultPoint(right, rowNumber)],
        BarcodeFormat.CODE_93);
  };

  /**
   * @param {!BitArray} row
   * @return {!Int32Array}
   * @throws {NotFoundException}
   * @private
   */
  pro.findAsteriskPattern_ = function(row) {
    var width = row.getSize();
    var rowOffset = row.getNextSet(0);

    this.counters_.fill(0);
    var theCounters = this.counters_;
    var patternStart = rowOffset;
    var isWhite = false;
    var patternLength = theCounters.length;

    var counterPosition = 0;
    for (let i = rowOffset; i < width; i++) {
      if (row.get(i) !== isWhite) {
        theCounters[counterPosition]++;
      } else {
        if (counterPosition === patternLength - 1) {
          if (toPattern(theCounters) === Code93Reader.ASTERISK_ENCODING) {
            return Int32Array.of(patternStart, i);
          }
          patternStart += theCounters[0] + theCounters[1];
          //System.arraycopy(theCounters, 2, theCounters, 0, counterPosition - 1);
          theCounters.copyWithin(0, 2, 2 + counterPosition - 1);
          theCounters[counterPosition - 1] = 0;
          theCounters[counterPosition] = 0;
          counterPosition--;
        } else {
          counterPosition++;
        }
        theCounters[counterPosition] = 1;
        isWhite = !isWhite;
      }
    }
    throw new NotFoundException();
  };

  /**
   * @param {!Int32Array} counters
   * @return {number}
   * @private
   * @suppress {checkTypes}
   */
  function toPattern(counters) {
    var sum = 0;
    for (let counter of counters) {
      sum += counter;
    }
    var pattern = 0;
    var max = counters.length;
    for (let i = 0; i < max; i++) {
      let scaled = Math.round(counters[i] * 9.0 / sum);
      if (scaled < 1 || scaled > 4) {
        return -1;
      }
      if ((i & 0x01) === 0) {
        for (let j = 0; j < scaled; j++) {
          pattern = (pattern << 1) | 0x01;
        }
      } else {
        pattern <<= scaled;
      }
    }
    return pattern;
  }

  /**
   * @param {number} pattern
   * @returns {string}
   * @throws {NotFoundException}
   * @private
   */
  Code93Reader.patternToChar_ = function(pattern) {
    for (let i = 0; i < Code93Reader.CHARACTER_ENCODINGS.length; i++) {
      if (Code93Reader.CHARACTER_ENCODINGS[i] === pattern) {
        return Code93Reader.ALPHABET[i];
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
  Code93Reader.decodeExtended_ = function(encoded) {
    var length = encoded.length;
    var decoded = '';
    for (let i = 0; i < length; i++) {
      let c = encoded.charAt(i);
      if (c >= 'a' && c <= 'd') {
        if (i >= length - 1) {
          throw new FormatException();
        }
        let next = encoded.charAt(i + 1);
        let decodedChar = '\0';
        switch (c) {
          case 'd':
            // +A to +Z map to a to z
            if (next >= 'A' && next <= 'Z') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) + 32);
            } else {
              throw new FormatException();
            }
            break;
          case 'a':
            // $A to $Z map to control codes SH to SB
            if (next >= 'A' && next <= 'Z') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 64);
            } else {
              throw new FormatException();
            }
            break;
          case 'b':
            if (next >= 'A' && next <= 'E') {
              // %A to %E map to control codes ESC to USep
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 38);
            } else if (next >= 'F' && next <= 'J') {
              // %F to %J map to ; < = > ?
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 11);
            } else if (next >= 'K' && next <= 'O') {
              // %K to %O map to [ \ ] ^ _
              decodedChar = String.fromCharCode(next.charCodeAt(0) + 16);
            } else if (next >= 'P' && next <= 'S') {
              // %P to %S map to { | } ~
              decodedChar = String.fromCharCode(next.charCodeAt(0) + 43);
            } else if (next >= 'T' && next <= 'Z') {
              // %T to %Z all map to DEL (127)
              decodedChar = 127;
            } else {
              throw new FormatException();
            }
            break;
          case 'c':
            // /A to /O map to ! to , and /Z maps to :
            if (next >= 'A' && next <= 'O') {
              decodedChar = String.fromCharCode(next.charCodeAt(0) - 32);
            } else if (next === 'Z') {
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
   * @param {string} result
   * @throws {ChecksumException}
   */
  function checkChecksums(result){
    var length = result.length;
    checkOneChecksum(result, length - 2, 20);
    checkOneChecksum(result, length - 1, 15);
  }

  /**
   * @param {string} result
   * @param {number} checkPosition
   * @param {number} weightMax
   * @throws {ChecksumException}
   */
  function checkOneChecksum(result, checkPosition, weightMax) {
    var weight = 1;
    var total = 0;
    for (let i = checkPosition - 1; i >= 0; i--) {
      total += weight * Code93Reader.ALPHABET_STRING.indexOf(result.charAt(i));
      if (++weight > weightMax) {
        weight = 1;
      }
    }
    if (result.charAt(checkPosition) !== Code93Reader.ALPHABET[total % 47]) {
      throw new ChecksumException();
    }
  }
});
