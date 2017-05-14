// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright (C) 2012 ZXing authors
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


goog.provide('w69b.oned.UPCEANExtension2Support');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.Integer');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultMetadataType');
goog.require('w69b.ResultPoint');
goog.require('w69b.StringBuilder');
goog.require('w69b.common.BitArray');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const Integer = w69b.Integer;
  const NotFoundException = w69b.NotFoundException;
  const Result = w69b.Result;
  const ResultMetadataType = w69b.ResultMetadataType;
  const ResultPoint = w69b.ResultPoint;
  const StringBuilder = w69b.StringBuilder;
  const BitArray = w69b.common.BitArray;
  const UPCEANReader = w69b.oned.UPCEANReader;

  /**
   * @see UPCEANExtension5Support
   * @constructor
   * @final
   */
  w69b.oned.UPCEANExtension2Support = function() {
    /** @const {!Int32Array} */
    this.decodeMiddleCounters_ = new Int32Array(4);
    /** @const {!StringBuilder} */
    this.decodeRowStringBuffer_ = new StringBuilder();
  };
  const UPCEANExtension2Support = w69b.oned.UPCEANExtension2Support;
  const pro = UPCEANExtension2Support.prototype;

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

    var checkParity = 0;

    for (let x = 0; x < 2 && rowOffset < end; x++) {
      let bestMatch = UPCEANReader.decodeDigit(row, counters, rowOffset, UPCEANReader.L_AND_G_PATTERNS);
      resultString.append(String.fromCharCode('0'.charCodeAt(0) + bestMatch % 10));
      for (let counter of counters) {
        rowOffset += counter;
      }
      if (bestMatch >= 10) {
        checkParity |= 1 << (1 - x);
      }
      if (x !== 1) {
        // Read off separator if not last
        rowOffset = row.getNextSet(rowOffset);
        rowOffset = row.getNextUnset(rowOffset);
      }
    }

    if (resultString.length() !== 2) {
      throw new NotFoundException();
    }

    if (Integer.parseInt(resultString.toString()) % 4 !== checkParity) {
      throw new NotFoundException();
    }

    return rowOffset;
  };

  /**
   * @param {string} raw raw content of extension
   * @return {Object<ResultMetadataType,*>} formatted interpretation of raw content as a {@link Map} mapping
   *  one {@link ResultMetadataType} to appropriate value, or {@code null} if not known
   */
  function parseExtensionString(raw) {
    if (raw.length !== 2) {
      return null;
    }
    var result = {};
    result[ResultMetadataType.ISSUE_NUMBER] = raw;
    return result;
  }
});
