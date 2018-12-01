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

goog.provide('w69b.oned.EAN8Reader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.oned.UPCEANReader');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const UPCEANReader = w69b.oned.UPCEANReader;
  const decodeDigit = UPCEANReader.decodeDigit;
  const findGuardPattern = UPCEANReader.findGuardPattern;
  const L_PATTERNS = UPCEANReader.L_PATTERNS;
  const MIDDLE_PATTERN = UPCEANReader.MIDDLE_PATTERN;


  /**
   * Implements decoding of the EAN-8 format.
   * @constructor
   * @extends {UPCEANReader}
   * @final
   */
  w69b.oned.EAN8Reader = function() {
    goog.base(this);
    this.decodeMiddleCounters_ = new Int32Array(4);
  };
  const EAN8Reader = w69b.oned.EAN8Reader;
  goog.inherits(EAN8Reader, UPCEANReader);
  const pro = EAN8Reader.prototype;

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

    for (let x = 0; x < 4 && rowOffset < end; x++) {
      const bestMatch = decodeDigit(row, counters, rowOffset, L_PATTERNS);
      result.append(String.fromCharCode('0'.charCodeAt(0) + bestMatch % 10));
      for (const counter of counters) {
        rowOffset += counter;
      }
    }

    const middleRange = findGuardPattern(row, rowOffset, true, MIDDLE_PATTERN);
    rowOffset = middleRange[1];

    for (let x = 0; x < 4 && rowOffset < end; x++) {
      const bestMatch = decodeDigit(row, counters, rowOffset, L_PATTERNS);
      result.append(String.fromCharCode('0'.charCodeAt(0) + bestMatch));
      for (const counter of counters) {
        rowOffset += counter;
      }
    }

    return rowOffset;
  };

  /**
   * @override
   */
  pro.getBarcodeFormat = function() {
    return BarcodeFormat.EAN_8;
  };
});
