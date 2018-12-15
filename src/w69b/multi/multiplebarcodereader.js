// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2009 ZXing authors
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

goog.provide('w69b.multi.MultipleBarcodeReader');
goog.require('w69b.BinaryBitmap');
goog.require('w69b.DecodeHintType');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');


goog.scope(function() {
  const BinaryBitmap = w69b.BinaryBitmap;

  /**
   * Implementation of this interface attempt to read several barcodes from one image.
   * @interface
   */
  w69b.multi.MultipleBarcodeReader = function() { };
  const pro = w69b.multi.MultipleBarcodeReader.prototype;

  /**
   * @param {!BinaryBitmap} image
   * @param {!Object<!w69b.DecodeHintType,*>=} opt_hints
   * @return {!Array.<!w69b.Result>}
   * @throws {w69b.NotFoundException}
   */
  pro.decodeMultiple;
});
