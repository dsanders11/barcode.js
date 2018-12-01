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

goog.provide('w69b.oned.EAN13Reader');
goog.require('java.lang.StringBuilder');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.NotFoundException');
goog.require('w69b.oned.UPCEANReader');


goog.scope(function() {
  const StringBuilder = java.lang.StringBuilder;
  const BarcodeFormat = w69b.BarcodeFormat;
  const NotFoundException = w69b.NotFoundException;
  const UPCEANReader = w69b.oned.UPCEANReader;
  const decodeDigit = UPCEANReader.decodeDigit;
  const findGuardPattern = UPCEANReader.findGuardPattern;
  const L_AND_G_PATTERNS = UPCEANReader.L_AND_G_PATTERNS;
  const L_PATTERNS = UPCEANReader.L_PATTERNS;
  const MIDDLE_PATTERN = UPCEANReader.MIDDLE_PATTERN;

  // For an EAN-13 barcode, the first digit is represented by the parities used
  // to encode the next six digits, according to the table below. For example,
  // if the barcode is 5 123456 789012 then the value of the first digit is
  // signified by using odd for '1', even for '2', even for '3', odd for '4',
  // odd for '5', and even for '6'. See http://en.wikipedia.org/wiki/EAN-13
  //
  //                Parity of next 6 digits
  //    Digit   0     1     2     3     4     5
  //       0    Odd   Odd   Odd   Odd   Odd   Odd
  //       1    Odd   Odd   Even  Odd   Even  Even
  //       2    Odd   Odd   Even  Even  Odd   Even
  //       3    Odd   Odd   Even  Even  Even  Odd
  //       4    Odd   Even  Odd   Odd   Even  Even
  //       5    Odd   Even  Even  Odd   Odd   Even
  //       6    Odd   Even  Even  Even  Odd   Odd
  //       7    Odd   Even  Odd   Even  Odd   Even
  //       8    Odd   Even  Odd   Even  Even  Odd
  //       9    Odd   Even  Even  Odd   Even  Odd
  //
  // Note that the encoding for '0' uses the same parity as a UPC barcode. Hence
  // a UPC barcode can be converted to an EAN-13 barcode by prepending a 0.
  //
  // The encoding is represented by the following array, which is a bit pattern
  // using Odd = 0 and Even = 1. For example, 5 is represented by:
  //
  //              Odd Even Even Odd Odd Even
  // in binary:
  //                0    1    1   0   0    1   == 0x19
  //

  /**
   * @constructor
   * @extends {UPCEANReader}
   * @final
   */
  w69b.oned.EAN13Reader = function() {
    goog.base(this);
    this.decodeMiddleCounters_ = new Int32Array(4);
  };
  const EAN13Reader = w69b.oned.EAN13Reader;
  goog.inherits(EAN13Reader, UPCEANReader);
  const pro = EAN13Reader.prototype;

  /**
   * @const {!Int32Array}
   */
  EAN13Reader.FIRST_DIGIT_ENCODINGS = Int32Array.of(
    0x00, 0x0B, 0x0D, 0xE, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A
  );

  /**
   * @override
   */
  pro.decodeMiddle = function(row, startRange, resultString) {
    var counters = this.decodeMiddleCounters_;
    counters[0] = 0;
    counters[1] = 0;
    counters[2] = 0;
    counters[3] = 0;
    var end = row.getSize();
    var rowOffset = startRange[1];

    var lgPatternFound = 0;

    for (let x = 0; x < 6 && rowOffset < end; x++) {
      let bestMatch = decodeDigit(row, counters, rowOffset, L_AND_G_PATTERNS);
      resultString.append(String.fromCharCode('0'.charCodeAt(0) + bestMatch % 10));
      for (let counter of counters) {
        rowOffset += counter;
      }
      if (bestMatch >= 10) {
        lgPatternFound |= 1 << (5 - x);
      }
    }

    determineFirstDigit(resultString, lgPatternFound);

    var middleRange = findGuardPattern(row, rowOffset, true, MIDDLE_PATTERN);
    rowOffset = middleRange[1];

    for (let x = 0; x < 6 && rowOffset < end; x++) {
      let bestMatch = decodeDigit(row, counters, rowOffset, L_PATTERNS);
      resultString.append(String.fromCharCode('0'.charCodeAt(0) + bestMatch));
      for (let counter of counters) {
        rowOffset += counter;
      }
    }

    return rowOffset;
  };

  /**
   * @override
   */
  pro.getBarcodeFormat = function() {
    return BarcodeFormat.EAN_13;
  };

  /**
   * Based on pattern of odd-even ('L' and 'G') patterns used to encoded the explicitly-encoded
   * digits in a barcode, determines the implicitly encoded first digit and adds it to the
   * result string.
   *
   * @param {!StringBuilder} resultString string to insert decoded first digit into
   * @param {number} lgPatternFound int whose bits indicates the pattern of odd/even L/G patterns used to
   *  encode digits
   * @throws {!NotFoundException} if first digit cannot be determined
   */
  function determineFirstDigit(resultString, lgPatternFound) {
    for (let d = 0; d < 10; d++) {
      if (lgPatternFound === EAN13Reader.FIRST_DIGIT_ENCODINGS[d]) {
        resultString.insert(0, String.fromCharCode('0'.charCodeAt(0) + d));
        return;
      }
    }
    throw new NotFoundException();
  }
});
