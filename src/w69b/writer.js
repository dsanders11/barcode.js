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

goog.provide('w69b.Writer');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.EncodeHintType');
goog.require('w69b.WriterException');
goog.require('w69b.common.BitMatrix');

goog.scope(function() {
  var EncodeHintType = w69b.EncodeHintType;

  /**
   * The base class for all objects which encode/generate a barcode image.
   * @interface
   */
  w69b.Writer = function() { };
  var pro = w69b.Writer.prototype;

  /**
   * Encode a barcode using the default settings.
   *
   * @param {!string} contents the contents to encode in the barcode
   * @param {w69b.BarcodeFormat} format the barcode format to generate
   * @param {number} width the preferred width in pixels
   * @param {number} height the preferred height in pixels
   * @param {Object<EncodeHintType,*>=} opt_hints additional parameters to supply to the encoder
   * @return {w69b.common.BitMatrix} representing encoded barcode image
   * @throws {w69b.WriterException} if contents cannot be encoded legally in a format
   */
  pro.encode;
});
