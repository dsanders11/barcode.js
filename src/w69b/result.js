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

goog.provide('w69b.Result');
goog.require('goog.object');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.ResultMetadataType');
goog.require('w69b.ResultPoint');

// NOTE - numBits is explicitly left out as the constructor argument order
// didn't play nice with optional arguments and only Aztec barcodes needed it

goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const ResultMetadataType = w69b.ResultMetadataType;
  const ResultPoint = w69b.ResultPoint;

  /**
   * Encapsulates the result of decoding a barcode within an image.
   * @constructor
   * @param {string} text
   * @param {?Int8Array} rawBytes
   * @param {!Array.<!ResultPoint>} resultPoints
   * @param {!BarcodeFormat} format
   * @param {number=} opt_timestamp
   * @final
   */
  w69b.Result = function(text, rawBytes, resultPoints, format, opt_timestamp) {
    this.text_ = text;
    this.rawBytes_ = rawBytes;
    this.numBits_ = rawBytes === null ? 0 : 8 * rawBytes.length;
    this.resultPoints_ = resultPoints;
    this.format_ = format;
    this.resultMetadata_ = null;
    this.timestamp_ = opt_timestamp ? opt_timestamp : Date.now();
  };
  const Result = w69b.Result;
  const pro = Result.prototype;

  /**
   * @return {string} raw text encoded by the barcode
   */
  pro.getText = function() {
    return this.text_;
  };

  /**
   * @return {?Int8Array} raw bytes encoded by the barcode, if applicable, otherwise {@code null}
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
   * @return {!Array.<!ResultPoint>} points related to the barcode in the image.
   *                                 These are typically points identifying finder
   *                                 patterns or the corners of the barcode. The
   *                                 exact meaning is specific to the type of
   *                                 barcode that was decoded.
   */
  pro.getResultPoints = function() {
    return this.resultPoints_;
  };

  /**
   * @return {!BarcodeFormat} representing the format of the barcode that was decoded
   */
  pro.getBarcodeFormat = function() {
    return this.format_;
  };

  /**
   * @return {?Object<!ResultMetadataType,*>} mapping {@link ResultMetadataType}
   *                                          keys to values. May be {@code null}.
   *                                          This contains optional metadata
   *                                          about what was detected about the
   *                                          barcode, like orientation.
   */
  pro.getResultMetadata = function() {
    return this.resultMetadata_;
  };

  /**
   * @param {!ResultMetadataType} type
   * @param {*} value
   */
  pro.putMetadata = function(type, value) {
    if (this.resultMetadata_ === null) {
      this.resultMetadata_ = {};
    }
    this.resultMetadata_[type] = value;
  };

  /**
   * @param {?Object<!ResultMetadataType,*>} metadata
   */
  pro.putAllMetadata = function(metadata) {
    if (metadata !== null) {
      if (this.resultMetadata_ === null) {
        this.resultMetadata_ = goog.object.clone(metadata);
      } else {
        Object.assign(this.resultMetadata_, metadata);
      }
    }
  };

  /**
   * @param {!Array.<!ResultPoint>} newPoints
   */
  pro.addResultPoints = function(newPoints) {
    const oldPoints = this.resultPoints_;
    if (oldPoints === null) {
      this.resultPoints_ = newPoints;
    } else if (newPoints !== null && newPoints.length > 0) {
      this.resultPoints_ = oldPoints.concat(newPoints);
    }
  };

  /**
   * @return {number}
   */
  pro.getTimestamp = function() {
    return this.timestamp_;
  };

  /**
   * @override
   */
  pro.toString = function() {
    return this.text_;
  };

  /**
   * @return {!Object} JSON object.
   */
  pro['toJSON'] = function() {
    return {
      'text': this.getText(),
      'format': this.getBarcodeFormat(),
      'patterns': this.getResultPoints().map(pattern => pattern['toJSON']())
    };
  };
});
