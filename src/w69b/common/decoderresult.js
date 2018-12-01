// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
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

goog.provide('w69b.common.DecoderResult');


goog.scope(function() {
  /**
   * Encapsulates the result of decoding a matrix of bits. This typically
   * applies to 2D barcode formats. For now it contains the raw bytes obtained,
   * as well as a String interpretation of those bytes, if applicable.
   * @constructor
   * @param {?Int8Array} rawBytes
   * @param {string} text
   * @param {?Array.<!Int8Array>} byteSegments
   * @param {?string} ecLevel
   * @param {number=} opt_saSequence
   * @param {number=} opt_saParity
   * @final
   */
  w69b.common.DecoderResult = function(rawBytes, text, byteSegments, ecLevel, opt_saSequence, opt_saParity) {
    this.rawBytes_ = rawBytes;
    this.numBits_ = rawBytes === null ? 0 : 8 * rawBytes.length;
    this.text_ = text;
    this.byteSegments_ = byteSegments;
    this.ecLevel_ = ecLevel;
    this.structuredAppendParity_ = opt_saParity ? opt_saParity : -1;
    this.structuredAppendSequenceNumber_ = opt_saSequence ? opt_saSequence : -1;
  };
  const DecoderResult = w69b.common.DecoderResult;
  const pro = DecoderResult.prototype;

  /**
   * @return {?Int8Array} raw bytes representing the result, or {@code null} if not applicable
   */
  pro.getRawBytes = function() {
    return this.rawBytes_;
  };

  /**
   * @return {number} how many bits of {@link #getRawBytes()} are valid; typically 8 times its length
   */
  pro.getNumBits = function() {
    return this.numBits_;
  };

  /**
   * @param {number} numBits overrides the number of bits that are valid in {@link #getRawBytes()}
   */
  pro.setNumBits = function(numBits) {
    this.numBits_ = numBits;
  };

  /**
   * @return {string} text representation of the result
   */
  pro.getText = function() {
    return this.text_;
  };

  /**
   * @return {?Array.<!Int8Array>} list of byte segments in the result, or {@code null} if not applicable
   */
  pro.getByteSegments = function() {
    return this.byteSegments_;
  };

  /**
   * @return {?string} name of error correction level used, or {@code null} if not applicable
   */
  pro.getECLevel = function() {
    return this.ecLevel_;
  };

  /**
   * @return {?number} number of errors corrected, or {@code null} if not applicable
   */
  pro.getErrorsCorrected = function() {
    return this.errorsCorrected_;
  };

  /**
   * @param {number} errorsCorrected
   */
  pro.setErrorsCorrected = function(errorsCorrected) {
    this.errorsCorrected_ = errorsCorrected;
  };

  /**
   * @return {?number} number of erasures corrected, or {@code null} if not applicable
   */
  pro.getErasures = function() {
    return this.erasures_;
  };

  /**
   * @param {number} erasures
   */
  pro.setErasures = function(erasures) {
    this.erasures_ = erasures;
  };

  /**
   * @return {!Object} arbitrary additional metadata
   */
  pro.getOther = function() {
    return this.other_;
  };

  /**
   * @param {!Object} other
   */
  pro.setOther = function(other) {
    this.other_ = other;
  };

  /**
   * @return {boolean}
   */
  pro.hasStructuredAppend = function() {
    return this.structuredAppendParity_ >= 0 && this.structuredAppendSequenceNumber_ >= 0;
  };

  /**
   * @return {number}
   */
  pro.getStructuredAppendParity = function() {
    return this.structuredAppendParity_;
  };

  /**
   * @return {number}
   */
  pro.getStructuredAppendSequenceNumber = function() {
    return this.structuredAppendSequenceNumber_;
  };
});
