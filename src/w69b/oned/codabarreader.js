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

goog.provide('w69b.oned.CodaBarReader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.DecodeHintType');
goog.require('w69b.Integer');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultPoint');
goog.require('w69b.StringBuilder');
goog.require('w69b.common.BitArray');
goog.require('w69b.oned.OneDReader');


goog.scope(function() {
  var BarcodeFormat = w69b.BarcodeFormat;
  var DecodeHintType = w69b.DecodeHintType;
  var Integer = w69b.Integer;
  var NotFoundException = w69b.NotFoundException;
  var Result = w69b.Result;
  var ResultPoint = w69b.ResultPoint;
  var StringBuilder = w69b.StringBuilder;
  var BitArray = w69b.common.BitArray;
  var OneDReader = w69b.oned.OneDReader;

  /**
   * Decodes Codabar barcodes.
   * @constructor
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.CodaBarReader = function() {
    this.decodeRowResult_ = new StringBuilder();
    this.counters_ = new Int32Array(80);
    this.counterLength_ = 0;
  };
  var CodaBarReader = w69b.oned.CodaBarReader;
  goog.inherits(CodaBarReader, OneDReader);
  var pro = CodaBarReader.prototype;

  // These values are critical for determining how permissive the decoding
  // will be. All stripe sizes must be within the window these define, as
  // compared to the average stripe size.
  const MAX_ACCEPTABLE = 2.0;
  const PADDING = 1.5;

  /** @const {!Array.<string>} */
  CodaBarReader.ALPHABET = "0123456789-$:/.+ABCD".split('');

  /**
   * These represent the encodings of characters, as patterns of wide and
   * narrow bars. The 7 least-significant bits of each int correspond to the
   * pattern of wide and narrow, with 1s representing "wide" and 0s
   * representing narrow.
   * @const {!Int32Array}
   */
  CodaBarReader.CHARACTER_ENCODINGS = Int32Array.of(
    0x003, 0x006, 0x009, 0x060, 0x012, 0x042, 0x021, 0x024, 0x030, 0x048, // 0-9
    0x00c, 0x018, 0x045, 0x051, 0x054, 0x015, 0x01A, 0x029, 0x00B, 0x00E // -$:/.+ABCD
  );

  // minimal number of characters that should be present (including start and
  // stop characters) under normal circumstances this should be set to 3, but
  // can be set higher as a last-ditch attempt to reduce false positives.
  const MIN_CHARACTER_LENGTH = 3;

  // official start and end patterns
  /** @type {!Array.<string>} */
  const STARTEND_ENCODING = ['A', 'B', 'C', 'D'];
  // some Codabar generator allow the Codabar string to be closed by every
  // character. This will cause lots of false positives!

  // some industries use a checksum standard but this is not part of the
  // original Codabar standard for more information see :
  // http://www.mecsw.com/specs/codabar.html

  /**
   * @override
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    var counters = this.counters_;
    var decodeRowResult = this.decodeRowResult_;
    const counterLength = this.counterLength_;

    counters.fill(0);
    this.setCounters_(row);
    var startOffset = this.findStartPattern_();
    var nextStart = startOffset;

    decodeRowResult.setLength(0);
    do {
      let charOffset = this.toNarrowWidePattern_(nextStart);
      if (charOffset === -1) {
        throw new NotFoundException();
      }
      // Hack: We store the position in the alphabet table into a
      // StringBuilder, so that we can access the decoded patterns in
      // validatePattern. We'll translate to the actual characters later.
      decodeRowResult.append(String.fromCharCode(charOffset));
      nextStart += 8;
      // Stop as soon as we see the end character.
      if (decodeRowResult.length() > 1 &&
          STARTEND_ENCODING.includes(CodaBarReader.ALPHABET[charOffset])) {
        break;
      }
    } while (nextStart < counterLength); // no fixed end pattern so keep on reading while data is available

    // Look for whitespace after pattern:
    var trailingWhitespace = counters[nextStart - 1];
    var lastPatternSize = 0;
    for (let i = -8; i < -1; i++) {
      lastPatternSize += counters[nextStart + i];
    }

    // We need to see whitespace equal to 50% of the last pattern size,
    // otherwise this is probably a false positive. The exception is if we are
    // at the end of the row. (I.e. the barcode barely fits.)
    if (nextStart < counterLength && trailingWhitespace < lastPatternSize >> 1) {
      throw new NotFoundException();
    }

    this.validatePattern_(startOffset);

    // Translate character table offsets to actual characters.
    for (let i = 0; i < decodeRowResult.length(); i++) {
      decodeRowResult.setCharAt(i, CodaBarReader.ALPHABET[decodeRowResult.charAt(i).charCodeAt(0)]);
    }
    // Ensure a valid start and end character
    var startchar = decodeRowResult.charAt(0);
    if (!STARTEND_ENCODING.includes(startchar)) {
      throw new NotFoundException();
    }
    var endchar = decodeRowResult.charAt(decodeRowResult.length() - 1);
    if (!STARTEND_ENCODING.includes(endchar)) {
      throw new NotFoundException();
    }

    // remove stop/start characters character and check if a long enough string is contained
    if (decodeRowResult.length() <= MIN_CHARACTER_LENGTH) {
      // Almost surely a false positive ( start + stop + at least 1 character)
      throw new NotFoundException();
    }

    if (!hints || !!hints[DecodeHintType.RETURN_CODABAR_START_END]) {
      decodeRowResult.deleteCharAt(decodeRowResult.length() - 1);
      decodeRowResult.deleteCharAt(0);
    }

    var runningCount = 0;
    for (let i = 0; i < startOffset; i++) {
      runningCount += counters[i];
    }
    var left = runningCount;
    for (let i = startOffset; i < nextStart - 1; i++) {
      runningCount += counters[i];
    }
    var right = runningCount;
    return new Result(
        decodeRowResult.toString(),
        null,
        [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)],
        BarcodeFormat.CODABAR);
  };

  /**
   * @param {number} start
   * @throws {NotFoundException}
   */
  pro.validatePattern_ = function(start) {
    var counters = this.counters_;
    var decodeRowResult = this.decodeRowResult_;

    // First, sum up the total size of our four categories of stripe sizes;
    var sizes = Int32Array.of(0, 0, 0, 0);
    var counts = Int32Array.of(0, 0, 0, 0);
    var end = decodeRowResult.length() - 1;

    // We break out of this loop in the middle, in order to handle
    // inter-character spaces properly.
    var pos = start;
    for (let i = 0; true; i++) {
      let pattern = CodaBarReader.CHARACTER_ENCODINGS[decodeRowResult.charAt(i).charCodeAt(0)];
      for (let j = 6; j >= 0; j--) {
        // Even j = bars, while odd j = spaces. Categories 2 and 3 are for
        // long stripes, while 0 and 1 are for short stripes.
        let category = (j & 1) + (pattern & 1) * 2;
        sizes[category] += counters[pos + j];
        counts[category]++;
        pattern >>= 1;
      }
      if (i >= end) {
        break;
      }
      // We ignore the inter-character space - it could be of any size.
      pos += 8;
    }

    // Calculate our allowable size thresholds using fixed-point math.
    var maxes = new Float32Array(4);
    var mins = new Float32Array(4);
    // Define the threshold of acceptability to be the midpoint between the
    // average small stripe and the average large stripe. No stripe lengths
    // should be on the "wrong" side of that line.
    for (let i = 0; i < 2; i++) {
      mins[i] = 0.0;  // Accept arbitrarily small "short" stripes.
      mins[i + 2] = (sizes[i] / counts[i] + sizes[i + 2] / counts[i + 2]) / 2.0;
      maxes[i] = mins[i + 2];
      maxes[i + 2] = (sizes[i + 2] * MAX_ACCEPTABLE + PADDING) / counts[i + 2];
    }

    // Now verify that all of the stripes are within the thresholds.
    pos = start;
    for (let i = 0; true; i++) {
      let pattern = CodaBarReader.CHARACTER_ENCODINGS[decodeRowResult.charAt(i).charCodeAt(0)];
      for (let j = 6; j >= 0; j--) {
        // Even j = bars, while odd j = spaces. Categories 2 and 3 are for
        // long stripes, while 0 and 1 are for short stripes.
        let category = (j & 1) + (pattern & 1) * 2;
        let size = counters[pos + j];
        if (size < mins[category] || size > maxes[category]) {
          throw new NotFoundException();
        }
        pattern >>= 1;
      }
      if (i >= end) {
        break;
      }
      pos += 8;
    }
  };

  /**
   * Records the size of all runs of white and black pixels, starting with white.
   * This is just like recordPattern, except it records all the counters, and
   * uses our builtin "counters" member for storage.
   * @param {BitArray} row row to count from
   * @throws {NotFoundException}
   */
  pro.setCounters_ = function(row) {
    this.counterLength_ = 0;
    // Start from the first white bit.
    var i = row.getNextUnset(0);
    var end = row.getSize();
    if (i >= end) {
      throw new NotFoundException();
    }
    var isWhite = true;
    var count = 0;
    while (i < end) {
      if (row.get(i) !== isWhite) {
        count++;
      } else {
        this.counterAppend_(count);
        count = 1;
        isWhite = !isWhite;
      }
      i++;
    }
    this.counterAppend_(count);
  };

  /**
   * @param {number} e
   */
  pro.counterAppend_ = function(e) {
    var counters = this.counters_;

    counters[this.counterLength_] = e;
    this.counterLength_++;
    if (this.counterLength_ >= counters.length) {
      let temp = new Int32Array(this.counterLength_ * 2);
      temp.set(counters);
      this.counters_ = temp;
    }
  };

  /**
   * @return {number}
   * @throws {NotFoundException}
   */
  pro.findStartPattern_ = function() {
    var counters = this.counters_;
    const counterLength = this.counterLength_;

    for (let i = 1; i < counterLength; i += 2) {
      let charOffset = this.toNarrowWidePattern_(i);
      if (charOffset !== -1 && STARTEND_ENCODING.includes(CodaBarReader.ALPHABET[charOffset])) {
        // Look for whitespace before start pattern, >= 50% of width of start pattern
        // We make an exception if the whitespace is the first element.
        let patternSize = 0;
        for (let j = i; j < i + 7; j++) {
          patternSize += counters[j];
        }
        if (i === 1 || counters[i - 1] >= patternSize >> 1) {
          return i;
        }
      }
    }
    throw new NotFoundException();
  };

  /**
   * Assumes that counters[position] is a bar.
   * @param {number} position
   * @return {number}
   */
  pro.toNarrowWidePattern_ = function(position) {
    var counters = this.counters_;
    const counterLength = this.counterLength_;

    var end = position + 7;
    if (end >= counterLength) {
      return -1;
    }

    var theCounters = counters;

    var maxBar = 0;
    var minBar = Integer.MAX_VALUE;
    for (let j = position; j < end; j += 2) {
      let currentCounter = theCounters[j];
      if (currentCounter < minBar) {
        minBar = currentCounter;
      }
      if (currentCounter > maxBar) {
        maxBar = currentCounter;
      }
    }
    var thresholdBar = (minBar + maxBar) >> 1;

    var maxSpace = 0;
    var minSpace = Integer.MAX_VALUE;
    for (let j = position + 1; j < end; j += 2) {
      let currentCounter = theCounters[j];
      if (currentCounter < minSpace) {
        minSpace = currentCounter;
      }
      if (currentCounter > maxSpace) {
        maxSpace = currentCounter;
      }
    }
    var thresholdSpace = (minSpace + maxSpace) >> 1;

    var bitmask = 1 << 7;
    var pattern = 0;
    for (let i = 0; i < 7; i++) {
      let threshold = (i & 1) === 0 ? thresholdBar : thresholdSpace;
      bitmask >>= 1;
      if (theCounters[position + i] > threshold) {
        pattern |= bitmask;
      }
    }

    for (let i = 0; i < CodaBarReader.CHARACTER_ENCODINGS.length; i++) {
      if (CodaBarReader.CHARACTER_ENCODINGS[i] === pattern) {
        return i;
      }
    }
    return -1;
  };
});
