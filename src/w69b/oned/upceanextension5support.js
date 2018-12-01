// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright (C) 2010 ZXing authors
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


goog.provide('w69b.oned.UPCEANExtension5Support');
goog.require('java.lang.Integer');
goog.require('java.lang.StringBuilder');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultMetadataType');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitArray');


goog.scope(function() {
  const Integer = java.lang.Integer;
  const StringBuilder = java.lang.StringBuilder;
  const BarcodeFormat = w69b.BarcodeFormat;
  const NotFoundException = w69b.NotFoundException;
  const Result = w69b.Result;
  const ResultMetadataType = w69b.ResultMetadataType;
  const ResultPoint = w69b.ResultPoint;
  const BitArray = w69b.common.BitArray;
  const UPCEANReader = w69b.oned.UPCEANReader;

  /**
   * @see UPCEANExtension2Support
   * @constructor
   * @final
   */
  w69b.oned.UPCEANExtension5Support = function() {
    /** @const {!Int32Array} */
    this.decodeMiddleCounters_ = new Int32Array(4);
    /** @const {!StringBuilder} */
    this.decodeRowStringBuffer_ = new StringBuilder();
  };
  const UPCEANExtension5Support = w69b.oned.UPCEANExtension5Support;
  const pro = UPCEANExtension5Support.prototype;

  const CHECK_DIGIT_ENCODINGS = Int32Array.of(
    0x18, 0x14, 0x12, 0x11, 0x0C, 0x06, 0x03, 0x0A, 0x09, 0x05
  );

  /**
   * @param {number} rowNumber
   * @param {!BitArray} row
   * @param {!Int32Array} extensionStartRange
   * @return {!Result}
   * @throws {!NotFoundException}
   */
  pro.decodeRow = function(rowNumber, row, extensionStartRange) {
    const result = this.decodeRowStringBuffer_;
    result.setLength(0);
    const end = this.decodeMiddle_(row, extensionStartRange, result);

    const resultString = result.toString();
    const extensionData = parseExtensionString(resultString);

    const extensionResult =
        new Result(resultString,
                   null,
                   [
                      new ResultPoint((extensionStartRange[0] + extensionStartRange[1]) / 2.0, rowNumber),
                      new ResultPoint(end, rowNumber),
                   ],
                   BarcodeFormat.UPC_EAN_EXTENSION);
    if (extensionData !== null) {
      extensionResult.putAllMetadata(extensionData);
    }
    return extensionResult;
  };

  /**
   * @param {!BitArray} row
   * @param {!Int32Array} startRange
   * @param {!StringBuilder} resultString
   * @return {number}
   * @throws {!NotFoundException}
   */
  pro.decodeMiddle_ = function(row, startRange, resultString) {
    const counters = this.decodeMiddleCounters_;
    counters[0] = 0;
    counters[1] = 0;
    counters[2] = 0;
    counters[3] = 0;
    const end = row.getSize();
    let rowOffset = startRange[1];

    let lgPatternFound = 0;

    for (let x = 0; x < 2 && rowOffset < end; x++) {
      const bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_AND_G_PATTERNS);
      resultString.append(String.fromCharCode('0'.charCodeAt(0) + bestMatch % 10));
      for (const counter of counters) {
        rowOffset += counter;
      }
      if (bestMatch >= 10) {
        lgPatternFound |= 1 << (4 - x);
      }
      if (x !== 4) {
        // Read off separator if not last
        rowOffset = row.getNextSet(rowOffset);
        rowOffset = row.getNextUnset(rowOffset);
      }
    }

    if (resultString.length() !== 5) {
      throw NotFoundException.getNotFoundInstance();
    }

    const checkDigit = determineCheckDigit(lgPatternFound);
    if (extensionChecksum(resultString.toString()) !== checkDigit) {
      throw NotFoundException.getNotFoundInstance();
    }

    return rowOffset;
  };

  /**
   * @param {string} s
   * @return {number}
   */
  function extensionChecksum(s) {
    const length = s.length;
    let sum = 0;
    for (let i = length - 2; i >= 0; i -= 2) {
      sum += s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0);
    }
    sum *= 3;
    for (let i = length - 1; i >= 0; i -= 2) {
      sum += s.charAt(i).charCodeAt(0) - '0'.charCodeAt(0) ;
    }
    sum *= 3;
    return sum % 10;
  }

  /**
   * @param {number} lgPatternFound
   * @return {number}
   * @throws {!NotFoundException}
   */
  function determineCheckDigit(lgPatternFound) {
    for (let d = 0; d < 10; d++) {
      if (lgPatternFound === CHECK_DIGIT_ENCODINGS[d]) {
        return d;
      }
    }
    throw NotFoundException.getNotFoundInstance();
  }

  /**
   * @param {string} raw raw content of extension
   * @return {?Object<!ResultMetadataType,*>} formatted interpretation of raw content as a {@link Map} mapping
   *  one {@link ResultMetadataType} to appropriate value, or {@code null} if not known
   */
  function parseExtensionString(raw) {
    if (raw.length !== 5) {
      return null;
    }
    const value = parseExtension5String(raw);
    if (value === null) {
      return null;
    }
    const result = {};
    result[ResultMetadataType.SUGGESTED_PRICE] = value;
    return result;
  }

  /**
   * @param {string} raw
   * @return {?string}
   */
  function parseExtension5String(raw) {
    let currency;
    switch (raw.charAt(0)) {
      case '0':
        currency = "£";
        break;
      case '5':
        currency = "$";
        break;
      case '9':
        // Reference: http://www.jollytech.com
        if ("90000" === raw) {
          // No suggested retail price
          return null;
        }
        if ("99991" === raw) {
          // Complementary
          return "0.00";
        }
        if ("99990" === raw) {
          return "Used";
        }
        // Otherwise... unknown currency?
        currency = "";
        break;
      default:
        currency = "";
        break;
    }
    const rawAmount = Integer.parseInt(raw.substring(1));
    const unitsString = (rawAmount / 100).toString();
    const hundredths = rawAmount % 100;
    const hundredthsString = hundredths < 10 ? "0" + hundredths : (hundredths).toString();
    return currency + unitsString + '.' + hundredthsString;
  }
});
