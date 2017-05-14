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

goog.provide('w69b.oned.UPCEANReader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.ChecksumException');
goog.require('w69b.DecodeHintType');
goog.require('w69b.FormatException');
goog.require('w69b.Integer');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultMetadataType');
goog.require('w69b.ResultPoint');
goog.require('w69b.StringBuilder');
goog.require('w69b.common.BitArray');
goog.require('w69b.oned.EANManufacturerOrgSupport');
goog.require('w69b.oned.OneDReader');
goog.require('w69b.oned.UPCEANExtensionSupport');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const ChecksumException = w69b.ChecksumException;
  const DecodeHintType = w69b.DecodeHintType;
  const FormatException = w69b.FormatException;
  const Integer = w69b.Integer;
  const NotFoundException = w69b.NotFoundException;
  const Result = w69b.Result;
  const ResultMetadataType = w69b.ResultMetadataType;
  const ResultPoint = w69b.ResultPoint;
  const StringBuilder = w69b.StringBuilder;
  const BitArray = w69b.common.BitArray;
  const EANManufacturerOrgSupport = w69b.oned.EANManufacturerOrgSupport;
  const OneDReader = w69b.oned.OneDReader;
  const patternMatchVariance = OneDReader.patternMatchVariance;
  const recordPattern = OneDReader.recordPattern;
  const UPCEANExtensionSupport = w69b.oned.UPCEANExtensionSupport;

  /**
   * Encapsulates functionality and implementation that is common to UPC and
   * EAN families of one-dimensional barcodes.
   * @constructor
   * @extends {OneDReader}
   * @abstract
   */
  w69b.oned.UPCEANReader = function() {
    /** @const {!StringBuilder} */
    this.decodeRowStringBuffer_ = new StringBuilder();
    /** @const {!UPCEANExtensionSupport} */
    this.extensionReader_ = new UPCEANExtensionSupport();
    /** @const {!EANManufacturerOrgSupport} */
    this.eanManSupport_ = new EANManufacturerOrgSupport();
  };
  const UPCEANReader = w69b.oned.UPCEANReader;
  goog.inherits(UPCEANReader, OneDReader);
  const pro = UPCEANReader.prototype;

  // These two values are critical for determining how permissive the decoding will be.
  // We've arrived at these values through a lot of trial and error. Setting them any higher
  // lets false positives creep in quickly.
  const MAX_AVG_VARIANCE = 0.48;
  const MAX_INDIVIDUAL_VARIANCE = 0.7;

  /**
   * Start/end guard pattern.
   * @const {!Int32Array}
   */
  UPCEANReader.START_END_PATTERN = Int32Array.of(1, 1, 1);
  const START_END_PATTERN = UPCEANReader.START_END_PATTERN;

  /**
   * Pattern marking the middle of a UPC/EAN pattern, separating the two halves.
   * @const {!Int32Array}
   */
  UPCEANReader.MIDDLE_PATTERN = Int32Array.of(1, 1, 1, 1, 1);
  /**
   * end guard pattern.
   */
  UPCEANReader.END_PATTERN = Int32Array.of(1, 1, 1, 1, 1, 1);
  const END_PATTERN = UPCEANReader.END_PATTERN;
  /**
   * "Odd", or "L" patterns used to encode UPC/EAN digits.
   * @const {!Array<!Int32Array>}
   */
  UPCEANReader.L_PATTERNS = [
    Int32Array.of(3, 2, 1, 1), // 0
    Int32Array.of(2, 2, 2, 1), // 1
    Int32Array.of(2, 1, 2, 2), // 2
    Int32Array.of(1, 4, 1, 1), // 3
    Int32Array.of(1, 1, 3, 2), // 4
    Int32Array.of(1, 2, 3, 1), // 5
    Int32Array.of(1, 1, 1, 4), // 6
    Int32Array.of(1, 3, 1, 2), // 7
    Int32Array.of(1, 2, 1, 3), // 8
    Int32Array.of(3, 1, 1, 2)  // 9
  ];

  /**
   * As above but also including the "even", or "G" patterns used to encode UPC/EAN digits.
   * @const {!Array<!Int32Array>}
   */
  UPCEANReader.L_AND_G_PATTERNS = function() {
    var temp = UPCEANReader.L_PATTERNS.slice();
    for (let i = 10; i < 20; i++) {
      let widths = UPCEANReader.L_PATTERNS[i - 10];
      let reversedWidths = new Int32Array(widths.length);
      for (let j = 0; j < widths.length; j++) {
        reversedWidths[j] = widths[widths.length - j - 1];
      }
      temp[i] = reversedWidths;
    }
    return temp;
  }();

  /**
   * @param {!BitArray} row
   * @return {!Int32Array}
   * @throws {NotFoundException}
   */
  UPCEANReader.findStartGuardPattern = function(row) {
    var foundStart = false;
    var startRange = null;
    var nextStart = 0;
    var counters = new Int32Array(START_END_PATTERN.length);
    while (!foundStart) {
      counters.fill(0);
      startRange = UPCEANReader.findGuardPattern_(row, nextStart, false, START_END_PATTERN, counters);
      let start = startRange[0];
      nextStart = startRange[1];
      // Make sure there is a quiet zone at least as big as the start pattern before the barcode.
      // If this check would run off the left edge of the image, do not accept this barcode,
      // as it is very likely to be a false positive.
      let quietStart = start - (nextStart - start);
      if (quietStart >= 0) {
        foundStart = row.isRange(quietStart, start, false);
      }
    }
    return startRange;
  };

  /**
   * @override
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    return this.decodeRow2(rowNumber, row, UPCEANReader.findStartGuardPattern(row), hints);
  };

  /**
   * Like {@link #decodeRow(int, BitArray, Map)}, but
   * allows caller to inform method about where the UPC/EAN start pattern is
   * found. This allows this to be computed once and reused across many implementations.
   *
   * @param {number} rowNumber row index into the image
   * @param {!BitArray} row encoding of the row of the barcode image
   * @param {!Int32Array} startGuardRange start/end column where the opening start pattern was found
   * @param {Object<DecodeHintType,*>} hints optional hints that influence decoding
   * @return {!Result} encapsulating the result of decoding a barcode in the row
   * @throws {NotFoundException} if no potential barcode is found
   * @throws {ChecksumException} if a potential barcode is found but does not pass its checksum
   * @throws {FormatException} if a potential barcode is found but format is invalid
   */
  pro.decodeRow2 = function(rowNumber, row, startGuardRange, hints) {
    var resultPointCallback = /** @type {(w69b.ResultPointCallback|undefined)} */ (!hints ? null :
        hints[DecodeHintType.NEED_RESULT_POINT_CALLBACK]);

    if (!resultPointCallback) {
      resultPointCallback = null;
    }

    if (resultPointCallback !== null) {
      resultPointCallback(new ResultPoint(
          (startGuardRange[0] + startGuardRange[1]) / 2.0, rowNumber
      ));
    }

    var result = this.decodeRowStringBuffer_;
    result.setLength(0);
    var endStart = this.decodeMiddle(row, startGuardRange, result);

    if (resultPointCallback !== null) {
      resultPointCallback(new ResultPoint(
          endStart, rowNumber
      ));
    }

    var endRange = this.decodeEnd(row, endStart);

    if (resultPointCallback !== null) {
      resultPointCallback(new ResultPoint(
          (endRange[0] + endRange[1]) / 2.0, rowNumber
      ));
    }


    // Make sure there is a quiet zone at least as big as the end pattern after the barcode. The
    // spec might want more whitespace, but in practice this is the maximum we can count on.
    var end = endRange[1];
    var quietEnd = end + (end - endRange[0]);
    if (quietEnd >= row.getSize() || !row.isRange(end, quietEnd, false)) {
      throw new NotFoundException();
    }

    var resultString = result.toString();
    // UPC/EAN should never be less than 8 chars anyway
    if (resultString.length < 8) {
      throw new FormatException();
    }
    if (!this.checkChecksum(resultString)) {
      throw new ChecksumException();
    }

    var left = (startGuardRange[1] + startGuardRange[0]) / 2.0;
    var right = (endRange[1] + endRange[0]) / 2.0;
    var format = this.getBarcodeFormat();
    var decodeResult = new Result(resultString,
        null, // no natural byte representation for these barcodes
        [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)],
        format);

    var extensionLength = 0;

    try {
      let extensionResult = this.extensionReader_.decodeRow(rowNumber, row, endRange[1]);
      decodeResult.putMetadata(ResultMetadataType.UPC_EAN_EXTENSION, extensionResult.getText());
      decodeResult.putAllMetadata(extensionResult.getResultMetadata());
      decodeResult.addResultPoints(extensionResult.getResultPoints());
      extensionLength = extensionResult.getText().length;
    } catch (/*ReaderException*/ re) {
      // continue
    }

    var allowedExtensions = /** @type {Int32Array} */ (
        !hints ? null : hints[DecodeHintType.ALLOWED_EAN_EXTENSIONS]);
    if (!allowedExtensions) {
      allowedExtensions = null;
    }
    if (allowedExtensions !== null) {
      let valid = false;
      for (let length of allowedExtensions) {
        if (extensionLength === length) {
          valid = true;
          break;
        }
      }
      if (!valid) {
        throw new NotFoundException();
      }
    }

    if (format === BarcodeFormat.EAN_13 || format === BarcodeFormat.UPC_A) {
      let countryID = this.eanManSupport_.lookupCountryIdentifier(resultString);
      if (countryID !== null) {
        decodeResult.putMetadata(ResultMetadataType.POSSIBLE_COUNTRY, countryID);
      }
    }

    return decodeResult;
  };

  /**
   * @param {string} s string of digits to check
   * @return {boolean} {@link #checkStandardUPCEANChecksum(CharSequence)}
   * @throws {FormatException} if the string does not contain only digits
   */
  pro.checkChecksum = function(s) {
    return UPCEANReader.checkStandardUPCEANChecksum(s);
  };

  /**
   * Computes the UPC/EAN checksum on a string of digits, and reports
   * whether the checksum is correct or not.
   *
   * @param {string} s string of digits to check
   * @return {boolean} true iff string of digits passes the UPC/EAN checksum algorithm
   * @throws {FormatException} if the string does not contain only digits
   */
  UPCEANReader.checkStandardUPCEANChecksum = function(s) {
    var length = s.length;
    if (length === 0) {
      return false;
    }
    var check = Integer.parseInt(s.charAt(length - 1));
    return UPCEANReader.getStandardUPCEANChecksum(s.slice(0, length - 1)) === check;
  };

  /**
   * @param {string} s
   * @return {number}
   * @throws {FormatException}
   */
  UPCEANReader.getStandardUPCEANChecksum = function(s) {
    var length = s.length;
    var sum = 0;
    for (let i = length - 1; i >= 0; i -= 2) {
      let digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
      if (digit < 0 || digit > 9) {
        throw new FormatException();
      }
      sum += digit;
    }
    sum *= 3;
    for (let i = length - 2; i >= 0; i -= 2) {
      let digit = s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
      if (digit < 0 || digit > 9) {
        throw new FormatException();
      }
      sum += digit;
    }
    return (1000 - sum) % 10;
  };

  /**
   * @param {!BitArray} row
   * @param {number} endStart
   * @return {!Int32Array}
   * @throws {NotFoundException}
   */
  pro.decodeEnd = function(row, endStart) {
    return UPCEANReader.findGuardPattern(row, endStart, false, START_END_PATTERN);
  };

  /**
   * @param {!BitArray} row
   * @param {number} rowOffset
   * @param {boolean} whiteFirst
   * @param {!Int32Array} pattern
   * @return {!Int32Array}
   * @throws {NotFoundException}
   */
  UPCEANReader.findGuardPattern = function(row, rowOffset, whiteFirst, pattern) {
    return UPCEANReader.findGuardPattern_(row, rowOffset, whiteFirst, pattern, new Int32Array(pattern.length));
  };

  /**
   * @param {!BitArray} row row of black/white values to search
   * @param {number} rowOffset position to start search
   * @param {boolean} whiteFirst if true, indicates that the pattern specifies white/black/white/...
   * pixel counts, otherwise, it is interpreted as black/white/black/...
   * @param {!Int32Array} pattern pattern of counts of number of black and white pixels that are being
   * searched for as a pattern
   * @param {!Int32Array} counters array of counters, as long as pattern, to re-use
   * @return {!Int32Array} start/end horizontal offset of guard pattern, as an array of two ints
   * @throws {NotFoundException} if pattern is not found
   */
  UPCEANReader.findGuardPattern_ = function(row, rowOffset, whiteFirst, pattern, counters) {
    var width = row.getSize();
    rowOffset = whiteFirst ? row.getNextUnset(rowOffset) : row.getNextSet(rowOffset);
    var counterPosition = 0;
    var patternStart = rowOffset;
    var patternLength = pattern.length;
    var isWhite = whiteFirst;
    for (let x = rowOffset; x < width; x++) {
      if (row.get(x) !== isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition === patternLength - 1) {
          if (patternMatchVariance(counters, pattern, MAX_INDIVIDUAL_VARIANCE) < MAX_AVG_VARIANCE) {
            return Int32Array.of(patternStart, x);
          }
          patternStart += counters[0] + counters[1];
          counters.copyWithin(0, 2, 2 + counterPosition - 1);
          counters[counterPosition - 1] = 0;
          counters[counterPosition] = 0;
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
   * Attempts to decode a single UPC/EAN-encoded digit.
   *
   * @param {!BitArray} row row of black/white values to decode
   * @param {!Int32Array} counters the counts of runs of observed black/white/black/... values
   * @param {number} rowOffset horizontal offset to start decoding from
   * @param {!Array.<!Int32Array>} patterns the set of patterns to use to decode -- sometimes different encodings
   * for the digits 0-9 are used, and this indicates the encodings for 0 to 9 that should
   * be used
   * @return {number} horizontal offset of first pixel beyond the decoded digit
   * @throws {NotFoundException} if digit cannot be decoded
   */
  UPCEANReader.decodeDigit = function(row, counters, rowOffset, patterns) {
    recordPattern(row, rowOffset, counters);
    var bestVariance = MAX_AVG_VARIANCE; // worst variance we'll accept
    var bestMatch = -1;
    var max = patterns.length;
    for (let i = 0; i < max; i++) {
      let pattern = patterns[i];
      let variance = patternMatchVariance(counters, pattern, MAX_INDIVIDUAL_VARIANCE);
      if (variance < bestVariance) {
        bestVariance = variance;
        bestMatch = i;
      }
    }
    if (bestMatch >= 0) {
      return bestMatch;
    } else {
      throw new NotFoundException();
    }
  };

  /**
   * Get the format of this decoder.
   *
   * @return {!BarcodeFormat} The 1D format.
   */
  pro.getBarcodeFormat;

  /**
   * Subclasses override this to decode the portion of a barcode between the start
   * and end guard patterns.
   *
   * @param {!BitArray} row row of black/white values to search
   * @param {!Int32Array} startRange start/end offset of start guard pattern
   * @param {!StringBuilder} resultString {@link StringBuilder} to append decoded chars to
   * @return {number} horizontal offset of first pixel after the "middle" that was decoded
   * @throws {NotFoundException} if decoding could not complete successfully
   */
  pro.decodeMiddle;
});
