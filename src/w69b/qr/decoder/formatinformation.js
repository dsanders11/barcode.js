// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/*
 Ported to JavaScript by Lazar Laszlo 2011

 lazarsoft@gmail.com, www.lazarsoft.info

 */
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
goog.require('w69b.qr.decoder.ErrorCorrectionLevel');

goog.scope(function() {
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
  var URShift = w69b.qr.decoder.URShift;


  /**
   * @param {number} formatInfo format information.
   * @constructor
   */
  w69b.qr.decoder.FormatInformation = function(formatInfo) {
    this.errorCorrectionLevel =
      w69b.qr.decoder.ErrorCorrectionLevel.forBits((formatInfo >> 3) & 0x03);
    this.dataMask = (formatInfo & 0x07);
  };
  var FormatInformation = w69b.qr.decoder.FormatInformation;
  var pro = FormatInformation.prototype;

  FormatInformation.FORMAT_INFO_MASK_QR = 0x5412;

  /**
   * @type {Array.<Array.<number>>}
   */
  FormatInformation.FORMAT_INFO_DECODE_LOOKUP = [
    [0x5412, 0x00],
    [0x5125, 0x01],
    [0x5E7C, 0x02],
    [0x5B4B, 0x03],
    [0x45F9, 0x04],
    [0x40CE, 0x05],
    [0x4F97, 0x06],
    [0x4AA0, 0x07],
    [0x77C4, 0x08],
    [0x72F3, 0x09],
    [0x7DAA, 0x0A],
    [0x789D, 0x0B],
    [0x662F, 0x0C],
    [0x6318, 0x0D],
    [0x6C41, 0x0E],
    [0x6976, 0x0F],
    [0x1689, 0x10],
    [0x13BE, 0x11],
    [0x1CE7, 0x12],
    [0x19D0, 0x13],
    [0x0762, 0x14],
    [0x0255, 0x15],
    [0x0D0C, 0x16],
    [0x083B, 0x17],
    [0x355F, 0x18],
    [0x3068, 0x19],
    [0x3F31, 0x1A],
    [0x3A06, 0x1B],
    [0x24B4, 0x1C],
    [0x2183, 0x1D],
    [0x2EDA, 0x1E],
    [0x2BED, 0x1F]
  ];

  /**
   * Offset i holds the number of 1 bits in the binary representation of i
   * @type {Array.<number>}
   */
  FormatInformation.BITS_SET_IN_HALF_BYTE = [0, 1, 1, 2, 1, 2, 2, 3,
    1, 2, 2, 3, 2, 3, 3, 4];

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
    return this.errorCorrectionLevel == other.errorCorrectionLevel &&
      this.dataMask == other.dataMask;
  };

  /**
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  FormatInformation.numBitsDiffering = function(a, b) {
    a ^= b; // a now has a 1 bit exactly where its bit differs with b's
    // Count bits set quickly with a series of lookups:
    return FormatInformation.BITS_SET_IN_HALF_BYTE[a & 0x0F] +
      FormatInformation.BITS_SET_IN_HALF_BYTE[(URShift(a, 4) & 0x0F)] +
      FormatInformation.BITS_SET_IN_HALF_BYTE[(URShift(a, 8) & 0x0F)] +
      FormatInformation.BITS_SET_IN_HALF_BYTE[(URShift(a, 12) & 0x0F)] +
      FormatInformation.BITS_SET_IN_HALF_BYTE[(URShift(a, 16) & 0x0F)] +
      FormatInformation.BITS_SET_IN_HALF_BYTE[(URShift(a, 20) & 0x0F)] +
      FormatInformation.BITS_SET_IN_HALF_BYTE[(URShift(a, 24) & 0x0F)] +
      FormatInformation.BITS_SET_IN_HALF_BYTE[(URShift(a, 28) & 0x0F)];
  };

  /**
   * @param {number} maskedFormatInfo
   * @return {FormatInformation}
   */
  FormatInformation.decodeFormatInformation = function(maskedFormatInfo) {
    var formatInfo = FormatInformation.doDecodeFormatInformation(
      maskedFormatInfo);
    if (formatInfo != null) {
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
    var bestDifference = 0xffffffff;
    var bestFormatInfo = 0;
    for (var i = 0; i < FormatInformation.FORMAT_INFO_DECODE_LOOKUP.length;
         i++) {
      var decodeInfo = FormatInformation.FORMAT_INFO_DECODE_LOOKUP[i];
      var targetInfo = decodeInfo[0];
      if (targetInfo == maskedFormatInfo) {
        // Found an exact match
        return new FormatInformation(decodeInfo[1]);
      }
      var bitsDifference = FormatInformation.numBitsDiffering(
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
});
