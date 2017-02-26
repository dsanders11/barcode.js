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

goog.provide('w69b.MultiFormatWriter');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.NotFoundException');
goog.require('w69b.Writer');
goog.require('w69b.oned.Code128Writer');
goog.require('w69b.oned.Code39Writer');
goog.require('w69b.oned.Code93Writer');
goog.require('w69b.oned.ITFWriter');
goog.require('w69b.qr.QRCodeWriter');

goog.scope(function() {
  var BarcodeFormat = w69b.BarcodeFormat;
  var NotFoundException = w69b.NotFoundException;
  var Writer = w69b.Writer;
  var Code39Writer = w69b.oned.Code39Writer;
  var Code128Writer = w69b.oned.Code128Writer;
  var Code93Writer = w69b.oned.Code93Writer;
  var ITFWriter = w69b.oned.ITFWriter;
  var QRCodeWriter = w69b.qr.QRCodeWriter;

  /**
   * This is a factory class which finds the appropriate Writer subclass for the
   * BarcodeFormat requested and encodes the barcode with the supplied contents.
   * @constructor
   * @implements {Writer}
   * @final
   */
  w69b.MultiFormatWriter = function() { };
  var pro = w69b.MultiFormatWriter.prototype;

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    /** @type {Writer} */
    var writer = null;

    switch (format) {
      case BarcodeFormat.QR_CODE:
        writer = new QRCodeWriter();
        break;
      case BarcodeFormat.CODE_39:
        writer = new Code39Writer();
        break;
      case BarcodeFormat.CODE_93:
        writer = new Code93Writer();
        break;
      case BarcodeFormat.CODE_128:
        writer = new Code128Writer();
        break;
      case BarcodeFormat.ITF:
        writer = new ITFWriter();
        break;
      default:
        throw new NotFoundException("No encoder available for format " + format);
    }
    return writer.encode(contents, format, width, height, opt_hints);
  };
});
