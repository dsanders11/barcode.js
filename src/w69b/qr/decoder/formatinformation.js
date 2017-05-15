// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
// javascript port (c) 2011 Lazar Laszlo (lazarsoft@gmail.com)
/*
 * Copyright 2007 ZXing authors
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
goog.provide('w69b.qr.decoder.FormatInformation');
goog.provide('w69b.qr.decoder.URShift');
goog.require('java.lang.Integer');
goog.require('w69b.qr.decoder.ErrorCorrectionLevel');

goog.scope(function() {
  const Integer = java.lang.Integer;
  const ErrorCorrectionLevel = w69b.qr.decoder.ErrorCorrectionLevel;

  /**
   * @param {number} number todo.
   * @param {number} bits todo.
   * @return {number} todo.
   */
  w69b.qr.decoder.URShift = function(number, bits) {
    if (number >= 0)
      return number >> bits;
    else
      return (number >> bits) + (2 << ~bits);
  };
  const URShift = w69b.qr.decoder.URShift;


  /**
   * @param {number} formatInfo format information.
   * @constructor
   */
  w69b.qr.decoder.FormatInformation = function(formatInfo) {
    /** @private */
    this.errorCorrectionLevel =
      w69b.qr.decoder.ErrorCorrectionLevel.forBits((formatInfo >> 3) & 0x03);
    /** @private */
    this.dataMask = (formatInfo & 0x07);
  };
  const FormatInformation = w69b.qr.decoder.FormatInformation;
  const pro = FormatInformation.prototype;

  FormatInformation.FORMAT_INFO_MASK_QR = 0x5412;

  /**
   * @const {!Array.<!Int32Array>}
   */
  FormatInformation.FORMAT_INFO_DECODE_LOOKUP = [
    Int32Array.of(0x5412, 0x00),
    Int32Array.of(0x5125, 0x01),
    Int32Array.of(0x5E7C, 0x02),
    Int32Array.of(0x5B4B, 0x03),
    Int32Array.of(0x45F9, 0x04),
    Int32Array.of(0x40CE, 0x05),
    Int32Array.of(0x4F97, 0x06),
    Int32Array.of(0x4AA0, 0x07),
    Int32Array.of(0x77C4, 0x08),
    Int32Array.of(0x72F3, 0x09),
    Int32Array.of(0x7DAA, 0x0A),
    Int32Array.of(0x789D, 0x0B),
    Int32Array.of(0x662F, 0x0C),
    Int32Array.of(0x6318, 0x0D),
    Int32Array.of(0x6C41, 0x0E),
    Int32Array.of(0x6976, 0x0F),
    Int32Array.of(0x1689, 0x10),
    Int32Array.of(0x13BE, 0x11),
    Int32Array.of(0x1CE7, 0x12),
    Int32Array.of(0x19D0, 0x13),
    Int32Array.of(0x0762, 0x14),
    Int32Array.of(0x0255, 0x15),
    Int32Array.of(0x0D0C, 0x16),
    Int32Array.of(0x083B, 0x17),
    Int32Array.of(0x355F, 0x18),
    Int32Array.of(0x3068, 0x19),
    Int32Array.of(0x3F31, 0x1A),
    Int32Array.of(0x3A06, 0x1B),
    Int32Array.of(0x24B4, 0x1C),
    Int32Array.of(0x2183, 0x1D),
    Int32Array.of(0x2EDA, 0x1E),
    Int32Array.of(0x2BED, 0x1F)
  ];

  /**
   * @returns {number} hash code
   */
  pro.GetHashCode = function() {
    return (this.errorCorrectionLevel.ordinal << 3) | this.dataMask;
  };

  /**
   * @param {FormatInformation} other
   * @return {boolean} are they equal
   */
  pro.Equals = function(other) {
    return this.errorCorrectionLevel === other.errorCorrectionLevel &&
      this.dataMask === other.dataMask;
  };

  /**
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  FormatInformation.numBitsDiffering = function(a, b) {
    return Integer.bitCount(a ^ b);
  };

  /**
   * @param {number} maskedFormatInfo
   * @return {FormatInformation}
   */
  FormatInformation.decodeFormatInformation = function(maskedFormatInfo) {
    var formatInfo = FormatInformation.doDecodeFormatInformation(
      maskedFormatInfo);
    if (formatInfo !== null) {
      return formatInfo;
    }
    // Should return null, but, some QR codes apparently
    // do not mask this info. Try again by actually masking the pattern
    // first
    return FormatInformation.doDecodeFormatInformation(maskedFormatInfo ^
      FormatInformation.FORMAT_INFO_MASK_QR);
  };

  /**
   * @param {number} maskedFormatInfo
   * @return {FormatInformation}
   */
  FormatInformation.doDecodeFormatInformation = function(maskedFormatInfo) {
    // Find the int in FORMAT_INFO_DECODE_LOOKUP with fewest bits differing
    var bestDifference = Integer.MAX_VALUE;
    var bestFormatInfo = 0;
    for (let i = 0; i < FormatInformation.FORMAT_INFO_DECODE_LOOKUP.length;
         i++) {
      let decodeInfo = FormatInformation.FORMAT_INFO_DECODE_LOOKUP[i];
      let targetInfo = decodeInfo[0];
      if (targetInfo === maskedFormatInfo) {
        // Found an exact match
        return new FormatInformation(decodeInfo[1]);
      }
      let bitsDifference = FormatInformation.numBitsDiffering(
        maskedFormatInfo, targetInfo);
      if (bitsDifference < bestDifference) {
        bestFormatInfo = decodeInfo[1];
        bestDifference = bitsDifference;
      }
    }
    // Hamming distance of the 32 masked codes is 7, by construction,
    // so <= 3 bits differing means we found a match
    if (bestDifference <= 3) {
      return new FormatInformation(bestFormatInfo);
    }
    return null;
  };

  /**
   * @return {ErrorCorrectionLevel}
   */
  pro.getErrorCorrectionLevel = function() {
    return this.errorCorrectionLevel;
  };

  /**
   * @return {number}
   */
  pro.getDataMask = function() {
    return this.dataMask;
  };
});
