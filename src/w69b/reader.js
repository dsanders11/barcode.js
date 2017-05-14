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

goog.provide('w69b.Reader');
goog.require('w69b.BinaryBitmap');
goog.require('w69b.ChecksumException');
goog.require('w69b.DecodeHintType');
goog.require('w69b.FormatException');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');

goog.scope(function() {
  const BinaryBitmap = w69b.BinaryBitmap;
  const ChecksumException = w69b.ChecksumException;
  const DecodeHintType = w69b.DecodeHintType;
  const FormatException = w69b.FormatException;
  const NotFoundException = w69b.NotFoundException;
  const Result = w69b.Result;

  /**
   * Implementations of this interface can decode an image of a barcode in some
   * format into the String it encodes. For example, QRCodeReader can decode a
   * QR code. The decoder may optionally receive hints from the caller which may
   * help it decode more quickly or accurately.
   *
   * See {@link MultiFormatReader}, which attempts to determine what barcode
   * format is present within the image as well, and then decodes it accordingly.
   * @interface
   */
  w69b.Reader = function() { };
  const pro = w69b.Reader.prototype;

  /**
   * Locates and decodes a barcode in some format within an image.
   *
   * @param {!BinaryBitmap} image image of barcode to decode
   * @param {Object<DecodeHintType,*>=} opt_hints the meaning of the data depends upon the hint type.
   * @return {!Result} which the barcode encodes
   * @throws {NotFoundException} if no potential barcode is found
   * @throws {ChecksumException} if a potential barcode is found but does not pass its checksum
   * @throws {FormatException} if a potential barcode is found but format is invalid
   */
  pro.decode;

  /**
   * Resets any internal state the implementation has after a decode, to prepare
   * it for reuse.
   * @type {function()}
   */
  pro.reset;
});
