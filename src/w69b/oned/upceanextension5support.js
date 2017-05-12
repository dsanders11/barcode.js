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
goog.require('w69b.BarcodeFormat');
goog.require('w69b.Integer');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultMetadataType');
goog.require('w69b.ResultPoint');
goog.require('w69b.StringBuilder');
goog.require('w69b.common.BitArray');


goog.scope(function() {
  var BarcodeFormat = w69b.BarcodeFormat;
  var Integer = w69b.Integer;
  var NotFoundException = w69b.NotFoundException;
  var Result = w69b.Result;
  var ResultMetadataType = w69b.ResultMetadataType;
  var ResultPoint = w69b.ResultPoint;
  var StringBuilder = w69b.StringBuilder;
  var BitArray = w69b.common.BitArray;
  var UPCEANReader = w69b.oned.UPCEANReader;

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
  var UPCEANExtension5Support = w69b.oned.UPCEANExtension5Support;
  var pro = UPCEANExtension5Support.prototype;

  const CHECK_DIGIT_ENCODINGS = Int32Array.of(
    0x18, 0x14, 0x12, 0x11, 0x0C, 0x06, 0x03, 0x0A, 0x09, 0x05
  );

  /**
   * @param {number} rowNumber
   * @param {!BitArray} row
   * @param {!Int32Array} extensionStartRange
   * @return {!Result}
   * @throws {NotFoundException}
   */
  pro.decodeRow = function(rowNumber, row, extensionStartRange) {
    var result = this.decodeRowStringBuffer_;
    result.setLength(0);
    var end = this.decodeMiddle_(row, extensionStartRange, result);

    var resultString = result.toString();
    var extensionData = parseExtensionString(resultString);

    var extensionResult =
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
   * @throws {NotFoundException}
   */
  pro.decodeMiddle_ = function(row, startRange, resultString) {
    var counters = this.decodeMiddleCounters_;
    counters[0] = 0;
    counters[1] = 0;
    counters[2] = 0;
    counters[3] = 0;
    var end = row.getSize();
    var rowOffset = startRange[1];

    var lgPatternFound = 0;

    for (let x = 0; x < 2 && rowOffset < end; x++) {
      let bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_AND_G_PATTERNS);
      resultString.append(String.fromCharCode('0'.charCodeAt(0) + bestMatch % 10));
      for (let counter of counters) {
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
      throw new NotFoundException();
    }

    var checkDigit = determineCheckDigit(lgPatternFound);
    if (extensionChecksum(resultString.toString()) !== checkDigit) {
      throw new NotFoundException();
    }

    return rowOffset;
  };

  /**
   * @param {string} s
   * @return {number}
   */
  function extensionChecksum(s) {
    var length = s.length;
    var sum = 0;
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
   * @throws {NotFoundException}
   */
  function determineCheckDigit(lgPatternFound) {
    for (let d = 0; d < 10; d++) {
      if (lgPatternFound === CHECK_DIGIT_ENCODINGS[d]) {
        return d;
      }
    }
    throw new NotFoundException();
  }

  /**
   * @param {string} raw raw content of extension
   * @return {Object<ResultMetadataType,*>} formatted interpretation of raw content as a {@link Map} mapping
   *  one {@link ResultMetadataType} to appropriate value, or {@code null} if not known
   */
  function parseExtensionString(raw) {
    if (raw.length !== 5) {
      return null;
    }
    var value = parseExtension5String(raw);
    if (value === null) {
      return null;
    }
    var result = {};
    result[ResultMetadataType.SUGGESTED_PRICE] = value;
    return result;
  }

  /**
   * @param {string} raw
   * @return {?string}
   */
  function parseExtension5String(raw) {
    var currency;
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
    var rawAmount = Integer.parseInt(raw.substring(1));
    var unitsString = (rawAmount / 100).toString();
    var hundredths = rawAmount % 100;
    var hundredthsString = hundredths < 10 ? "0" + hundredths : (hundredths).toString();
    return currency + unitsString + '.' + hundredthsString;
  }
});
