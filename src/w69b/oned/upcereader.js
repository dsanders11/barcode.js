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

goog.provide('w69b.oned.UPCEReader');
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

  /**
   * Implements decoding of the UPC-E format.
   * <a href="http://www.barcodeisland.com/upce.phtml">This</a> is a great reference for
   * UPC-E information.
   * @constructor
   * @extends {UPCEANReader}
   * @final
   */
  w69b.oned.UPCEReader = function() {
    UPCEReader.base(this, 'constructor');
    this.decodeMiddleCounters_ = new Int32Array(4);
  };
  const UPCEReader = w69b.oned.UPCEReader;
  goog.inherits(UPCEReader, UPCEANReader);
  const pro = UPCEReader.prototype;

  /**
   * The pattern that marks the middle, and end, of a UPC-E pattern.
   * There is no "second half" to a UPC-E barcode.
   */
  const MIDDLE_END_PATTERN = Int32Array.of(1, 1, 1, 1, 1, 1);

  // For an UPC-E barcode, the final digit is represented by the parities used
  // to encode the middle six digits, according to the table below.
  //
  //                Parity of next 6 digits
  //    Digit   0     1     2     3     4     5
  //       0    Even   Even  Even Odd  Odd   Odd
  //       1    Even   Even  Odd  Even Odd   Odd
  //       2    Even   Even  Odd  Odd  Even  Odd
  //       3    Even   Even  Odd  Odd  Odd   Even
  //       4    Even   Odd   Even Even Odd   Odd
  //       5    Even   Odd   Odd  Even Even  Odd
  //       6    Even   Odd   Odd  Odd  Even  Even
  //       7    Even   Odd   Even Odd  Even  Odd
  //       8    Even   Odd   Even Odd  Odd   Even
  //       9    Even   Odd   Odd  Even Odd   Even
  //
  // The encoding is represented by the following array, which is a bit pattern
  // using Odd = 0 and Even = 1. For example, 5 is represented by:
  //
  //              Odd Even Even Odd Odd Even
  // in binary:
  //                0    1    1   0   0    1   == 0x19
  //

  /**
   * See {@link #L_AND_G_PATTERNS}; these values similarly represent patterns
   * of even-odd parity encodings of digits that imply both the number system
   * (0 or 1) used, and the check digit.
   * @type {!Array.<!Int32Array>}
   */
  UPCEReader.NUMSYS_AND_CHECK_DIGIT_PATTERNS = [
    Int32Array.of(0x38, 0x34, 0x32, 0x31, 0x2C, 0x26, 0x23, 0x2A, 0x29, 0x25),
    Int32Array.of(0x07, 0x0B, 0x0D, 0x0E, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A)
  ];

  /**
   * @override
   */
  pro.decodeMiddle = function(row, startRange, result) {
    const counters = this.decodeMiddleCounters_;
    counters[0] = 0;
    counters[1] = 0;
    counters[2] = 0;
    counters[3] = 0;
    const end = row.getSize();
    let rowOffset = startRange[1];

    let lgPatternFound = 0;

    for (let x = 0; x < 6 && rowOffset < end; x++) {
      let bestMatch = decodeDigit(row, counters, rowOffset, L_AND_G_PATTERNS);
      result.append(String.fromCharCode((('0').charCodeAt(0) + bestMatch % 10)));
      for (const counter of counters) {
        rowOffset += counter;
      }
      if (bestMatch >= 10) {
        lgPatternFound |= 1 << (5 - x);
      }
    }

    determineNumSysAndCheckDigit(result, lgPatternFound);

    return rowOffset;
  };

  /**
   * @override
   */
  pro.decodeEnd = function(row, endStart) {
    return findGuardPattern(row, endStart, true, MIDDLE_END_PATTERN);
  };


  /**
   * @override
   */
  pro.checkChecksum = function(s) {
    return UPCEReader.base(this, 'checkChecksum', UPCEReader.convertUPCEtoUPCA(s));
  };

  /**
   * @param {!StringBuilder} resultString
   * @param {number} lgPatternFound
   * @throws {!NotFoundException}
   */
  function determineNumSysAndCheckDigit(resultString, lgPatternFound) {
    for (let numSys = 0; numSys <= 1; numSys++) {
      for (let d = 0; d < 10; d++) {
        if (lgPatternFound === UPCEReader.NUMSYS_AND_CHECK_DIGIT_PATTERNS[numSys][d]) {
          resultString.insert(0, String.fromCharCode((('0').charCodeAt(0) + numSys)));
          resultString.append(String.fromCharCode((('0').charCodeAt(0) + d)));
          return;
        }
      }
    }
    throw NotFoundException.getNotFoundInstance();
  }

  /**
   * @override
   */
  pro.getBarcodeFormat = function() {
    return BarcodeFormat.UPC_E;
  };

  /**
   * Expands a UPC-E value back into its full, equivalent UPC-A code value.
   *
   * @param {string} upce UPC-E code as string of digits
   * @return {string} equivalent UPC-A code as string of digits
   */
  UPCEReader.convertUPCEtoUPCA = function(upce) {
    const upceChars = upce.slice(1, 7);
    const result = new StringBuilder();
    result.append(upce.charAt(0));
    const lastChar = upceChars[5];
    switch (lastChar) {
      case '0':
      case '1':
      case '2':
        result.append2(upceChars, 0, 2);
        result.append(lastChar);
        result.append("0000");
        result.append2(upceChars, 2, 3);
        break;
      case '3':
        result.append2(upceChars, 0, 3);
        result.append("00000");
        result.append2(upceChars, 3, 2);
        break;
      case '4':
        result.append2(upceChars, 0, 4);
        result.append("00000");
        result.append(upceChars[4]);
        break;
      default:
        result.append2(upceChars, 0, 5);
        result.append("0000");
        result.append(lastChar);
        break;
    }
    // Only append check digit in conversion if supplied
    if (upce.length >= 8) {
      result.append(upce.charAt(7));
    }
    return result.toString();
  };
});
