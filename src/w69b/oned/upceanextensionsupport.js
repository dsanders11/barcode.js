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

goog.provide('w69b.oned.UPCEANExtensionSupport');
goog.require('w69b.NotFoundException');
goog.require('w69b.ReaderException');
goog.require('w69b.Result');
goog.require('w69b.common.BitArray');
goog.require('w69b.oned.UPCEANExtension2Support');
goog.require('w69b.oned.UPCEANExtension5Support');


goog.scope(function() {
  const NotFoundException = w69b.NotFoundException;
  const ReaderException = w69b.ReaderException;
  const Result = w69b.Result;
  const BitArray = w69b.common.BitArray;
  const UPCEANExtension2Support = w69b.oned.UPCEANExtension2Support;
  const UPCEANExtension5Support = w69b.oned.UPCEANExtension5Support;

  /**
   * @constructor
   * @final
   */
  w69b.oned.UPCEANExtensionSupport = function() {
    this.twoSupport_ = new UPCEANExtension2Support();
    this.fiveSupport_ = new UPCEANExtension5Support();
  };
  const UPCEANExtensionSupport = w69b.oned.UPCEANExtensionSupport;
  const pro = UPCEANExtensionSupport.prototype;

  const EXTENSION_START_PATTERN = Int32Array.of(1,1,2);

  /**
   * @param {number} rowNumber
   * @param {!BitArray} row
   * @param {number} rowOffset
   * @return {!Result}
   * @throws {NotFoundException}
   */
  pro.decodeRow = function(rowNumber, row, rowOffset) {
    var extensionStartRange = w69b.oned.UPCEANReader.findGuardPattern(row, rowOffset, false, EXTENSION_START_PATTERN);
    try {
      return this.fiveSupport_.decodeRow(rowNumber, row, extensionStartRange);
    } catch (/*ReaderException*/ ignored) {
      return this.twoSupport_.decodeRow(rowNumber, row, extensionStartRange);
    }
  };
});
