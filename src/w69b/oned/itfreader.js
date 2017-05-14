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

goog.provide('w69b.oned.ITFReader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.DecodeHintType');
goog.require('w69b.FormatException');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitArray');
goog.require('w69b.oned.OneDReader');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const DecodeHintType = w69b.DecodeHintType;
  const FormatException = w69b.FormatException;
  const NotFoundException = w69b.NotFoundException;
  const Result = w69b.Result;
  const ResultPoint = w69b.ResultPoint;
  const BitArray = w69b.common.BitArray;
  const OneDReader = w69b.oned.OneDReader;

  /**
   * Implements decoding of the ITF format, or Interleaved Two of Five.
   *
   * This Reader will scan ITF barcodes of certain lengths only.
   * At the moment it reads length 6, 8, 10, 12, 14, 16, 18, 20, 24, and 44 as
   * these have appeared "in the wild". Not all lengths are scanned, especially
   * shorter ones, to avoid false positives. This in turn is due to a lack of
   * required checksum function.
   *
   * The checksum is optional and is not applied by this Reader. The consumer
   * of the decoded value will have to apply a checksum if required.
   *
   * @author kevin.osullivan@sita.aero, SITA Lab.
   * @constructor
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.ITFReader = function() { };
  const ITFReader = w69b.oned.ITFReader;
  goog.inherits(ITFReader, OneDReader);
  const pro = ITFReader.prototype;

  /**
   * @private
   */
  const MAX_AVG_VARIANCE = 0.38;

  /**
   * @private
   */
  const MAX_INDIVIDUAL_VARIANCE = 0.78;

  /**
   * Pixel width of a wide line
   * @private
   */
  const W = 3;

  /**
   * Pixed width of a narrow line
   * @private
   */
  const N = 1;

  /**
   * Valid ITF lengths. Anything longer than the largest value is also allowed.
   */
  const DEFAULT_ALLOWED_LENGTHS = Int32Array.of(6, 8, 10, 12, 14);

  /**
   * Start/end guard pattern.
   *
   * Note: The end pattern is reversed because the row is reversed before
   * searching for the END_PATTERN
   */
  const START_PATTERN = Int32Array.of(N, N, N, N);
  const END_PATTERN_REVERSED = Int32Array.of(N, N, W);

  /**
   * Patterns of Wide / Narrow lines to indicate each digit
   * @const {!Array.<!Int32Array>}
   */
  ITFReader.PATTERNS = [
    Int32Array.of(N, N, W, W, N), // 0
    Int32Array.of(W, N, N, N, W), // 1
    Int32Array.of(N, W, N, N, W), // 2
    Int32Array.of(W, W, N, N, N), // 3
    Int32Array.of(N, N, W, N, W), // 4
    Int32Array.of(W, N, W, N, N), // 5
    Int32Array.of(N, W, W, N, N), // 6
    Int32Array.of(N, N, N, W, W), // 7
    Int32Array.of(W, N, N, W, N), // 8
    Int32Array.of(N, W, N, W, N)  // 9
  ];

  /**
   * @override
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    // Find out where the Middle section (payload) starts & ends
    var startRange = this.decodeStart_(row);
    var endRange = this.decodeEnd_(row);

    /** @type {!Array.<string>} */
    var result = [];
    ITFReader.decodeMiddle_(row, startRange[1], endRange[0], result);
    var resultString = result.join('');

    /** @type {Int32Array} */
    var allowedLengths = null;
    if (hints !== null) {
      allowedLengths = /** @type {Int32Array} */ (hints[DecodeHintType.ALLOWED_LENGTHS] || null);

    }
    if (allowedLengths === null) {
      allowedLengths = DEFAULT_ALLOWED_LENGTHS;
    }

    // To avoid false positives with 2D barcodes (and other patterns), make
    // an assumption that the decoded string must be a 'standard' length if it's short
    var length = resultString.length;
    var lengthOK = false;
    var maxAllowedLength = 0;
    for (let allowedLength of allowedLengths) {
      if (length === allowedLength) {
        lengthOK = true;
        break;
      }
      if (allowedLength > maxAllowedLength) {
        maxAllowedLength = allowedLength;
      }
    }
    if (!lengthOK && length > maxAllowedLength) {
      lengthOK = true;
    }
    if (!lengthOK) {
      throw new FormatException();
    }

    return new Result(
        resultString,
        null, // no natural byte representation for these barcodes
        [new ResultPoint(startRange[1], rowNumber),
         new ResultPoint(endRange[0], rowNumber)],
        BarcodeFormat.ITF);
  };

  /**
   * @param {BitArray} row row of black/white values to search
   * @param {number} payloadStart offset of start pattern
   * @param {number} payloadEnd
   * @param {Array.<string>} resultString string array to add decoded chars to
   * @throws {NotFoundException} if decoding could not complete successfully
   */
  ITFReader.decodeMiddle_ = function(row, payloadStart, payloadEnd, resultString) {
    // Digits are interleaved in pairs - 5 black lines for one digit, and the
    // 5
    // interleaved white lines for the second digit.
    // Therefore, need to scan 10 lines and then
    // split these into two arrays
    var counterDigitPair = new Int32Array(10);
    var counterBlack = new Int32Array(5);
    var counterWhite = new Int32Array(5);

    while (payloadStart < payloadEnd) {
      // Get 10 runs of black/white.
      OneDReader.recordPattern(row, payloadStart, counterDigitPair);
      // Split them into each array
      for (let k = 0; k < 5; k++) {
        let twoK = 2 * k;
        counterBlack[k] = counterDigitPair[twoK];
        counterWhite[k] = counterDigitPair[twoK + 1];
      }

      var bestMatch = ITFReader.decodeDigit_(counterBlack);
      resultString.push(String.fromCharCode('0'.charCodeAt(0) + bestMatch));
      bestMatch = ITFReader.decodeDigit_(counterWhite);
      resultString.push(String.fromCharCode('0'.charCodeAt(0) + bestMatch));

      for (let counterDigit of counterDigitPair) {
        payloadStart += counterDigit;
      }
    }
  };

  /**
   * Identify where the start of the middle / payload section starts.
   *
   * @param {BitArray} row row of black/white values to search
   * @return {Int32Array} array containing index of start of 'start block' and
   *                      end of 'start block'
   * @throws {NotFoundException}
   */
  pro.decodeStart_ = function(row) {
    var endStart = skipWhiteSpace_(row);
    var startPattern = ITFReader.findGuardPattern_(row, endStart, START_PATTERN);

    // Determine the width of a narrow line in pixels. We can do this by
    // getting the width of the start pattern and dividing by 4 because its
    // made up of 4 narrow lines.
    this.narrowLineWidth = (startPattern[1] - startPattern[0]) >> 2;

    this.validateQuietZone_(row, startPattern[0]);

    return startPattern;
  };

  /**
   * The start & end patterns must be pre/post fixed by a quiet zone. This
   * zone must be at least 10 times the width of a narrow line.  Scan back until
   * we either get to the start of the barcode or match the necessary number of
   * quiet zone pixels.
   *
   * Note: Its assumed the row is reversed when using this method to find
   * quiet zone after the end pattern.
   *
   * ref: http://www.barcode-1.net/i25code.html
   *
   * @param {BitArray} row bit array representing the scanned barcode.
   * @param {number} startPattern index into row of the start or end pattern.
   * @throws {NotFoundException} if the quiet zone cannot be found
   */
  pro.validateQuietZone_ = function(row, startPattern) {
    // expect to find this many pixels of quiet zone
    var quietCount = this.narrowLineWidth * 10;

    // if there are not so many pixel at all let's try as many as possible
    quietCount = quietCount < startPattern ? quietCount : startPattern;

    for (let i = startPattern - 1; quietCount > 0 && i >= 0; i--) {
      if (row.get(i)) {
        break;
      }
      quietCount--;
    }
    if (quietCount !== 0) {
      // Unable to find the necessary number of quiet zone pixels.
      throw new NotFoundException();
    }
  };

  /**
   * Skip all whitespace until we get to the first black line.
   *
   * @param {BitArray}row row of black/white values to search
   * @return {number} index of the first black line.
   * @throws {NotFoundException} Throws exception if no black lines are found
   *                             in the row
   */
  function skipWhiteSpace_(row) {
    var width = row.getSize();
    var endStart = row.getNextSet(0);
    if (endStart === width) {
      throw new NotFoundException();
    }

    return endStart;
  }

  /**
   * Identify where the end of the middle / payload section ends.
   *
   * @param {BitArray} row row of black/white values to search
   * @return {Int32Array} array containing index of start of 'end block' and
   *                      end of 'end block'
   */
  pro.decodeEnd_ = function(row) {
    // For convenience, reverse the row and then
    // search from 'the start' for the end block
    row.reverse();
    try {
      var endStart = skipWhiteSpace_(row);
      var endPattern = ITFReader.findGuardPattern_(row, endStart, END_PATTERN_REVERSED);

      // The start & end patterns must be pre/post fixed by a quiet zone. This
      // zone must be at least 10 times the width of a narrow line.
      // ref: http://www.barcode-1.net/i25code.html
      this.validateQuietZone_(row, endPattern[0]);

      // Now recalculate the indices of where the 'endblock' starts & stops to
      // accommodate
      // the reversed nature of the search
      var temp = endPattern[0];
      endPattern[0] = row.getSize() - endPattern[1];
      endPattern[1] = row.getSize() - temp;

      return endPattern;
    } finally {
      // Put the row back the right way.
      row.reverse();
    }
  };

  /**
   * @param {BitArray} row row of black/white values to search
   * @param {number} rowOffset position to start search
   * @param {Int32Array} pattern pattern of counts of number of black and white
   *                             pixels that are being searched for as a pattern
   * @return {Int32Array} start/end horizontal offset of guard pattern, as an
   *                      array of two ints
   * @throws {NotFoundException} if pattern is not found
   */
  ITFReader.findGuardPattern_ = function(row, rowOffset, pattern) {
    var patternLength = pattern.length;
    var counters = new Int32Array(patternLength);
    var width = row.getSize();
    var isWhite = false;

    var counterPosition = 0;
    var patternStart = rowOffset;
    for (let x = rowOffset; x < width; x++) {
      if (row.get(x) !== isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition === patternLength - 1) {
          if (OneDReader.patternMatchVariance(counters, pattern, MAX_INDIVIDUAL_VARIANCE) < MAX_AVG_VARIANCE) {
            return Int32Array.of(patternStart, x);
          }
          patternStart += counters[0] + counters[1];
          //System.arraycopy(counters, 2, counters, 0, counterPosition - 1);
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
   * Attempts to decode a sequence of ITF black/white lines into single
   * digit.
   *
   * @param {Int32Array} counters the counts of runs of observed
   *                              black/white/black/... values
   * @return {number} The decoded digit
   * @throws {NotFoundException} if digit cannot be decoded
   */
  ITFReader.decodeDigit_ = function(counters) {
    var bestVariance = MAX_AVG_VARIANCE; // worst variance we'll accept
    var bestMatch = -1;
    var max = ITFReader.PATTERNS.length;
    for (let i = 0; i < max; i++) {
      let pattern = ITFReader.PATTERNS[i];
      let variance = OneDReader.patternMatchVariance(counters, pattern, MAX_INDIVIDUAL_VARIANCE);
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
});
