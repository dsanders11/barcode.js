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
goog.require('w69b.oned.CodaBarWriter');
goog.require('w69b.oned.Code128Writer');
goog.require('w69b.oned.Code39Writer');
goog.require('w69b.oned.Code93Writer');
goog.require('w69b.oned.EAN13Writer');
goog.require('w69b.oned.EAN8Writer');
goog.require('w69b.oned.ITFWriter');
goog.require('w69b.oned.UPCAWriter');
goog.require('w69b.oned.UPCEWriter');
goog.require('w69b.qr.QRCodeWriter');

goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const NotFoundException = w69b.NotFoundException;
  const Writer = w69b.Writer;
  const CodaBarWriter = w69b.oned.CodaBarWriter;
  const Code39Writer = w69b.oned.Code39Writer;
  const Code128Writer = w69b.oned.Code128Writer;
  const Code93Writer = w69b.oned.Code93Writer;
  const EAN13Writer = w69b.oned.EAN13Writer;
  const EAN8Writer = w69b.oned.EAN8Writer;
  const ITFWriter = w69b.oned.ITFWriter;
  const UPCAWriter = w69b.oned.UPCAWriter;
  const UPCEWriter = w69b.oned.UPCEWriter;
  const QRCodeWriter = w69b.qr.QRCodeWriter;

  /**
   * This is a factory class which finds the appropriate Writer subclass for the
   * BarcodeFormat requested and encodes the barcode with the supplied contents.
   * @constructor
   * @implements {Writer}
   * @final
   */
  w69b.MultiFormatWriter = function() { };
  const pro = w69b.MultiFormatWriter.prototype;

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    /** @type {?Writer} */
    var writer = null;

    switch (format) {
      case BarcodeFormat.EAN_8:
        writer = new EAN8Writer();
        break;
      case BarcodeFormat.UPC_E:
        writer = new UPCEWriter();
        break;
      case BarcodeFormat.EAN_13:
        writer = new EAN13Writer();
        break;
      case BarcodeFormat.UPC_A:
        writer = new UPCAWriter();
        break;
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
      case BarcodeFormat.CODABAR:
        writer = new CodaBarWriter();
        break;
      default:
        throw new NotFoundException("No encoder available for format " + format);
    }
    return writer.encode(contents, format, width, height, opt_hints);
  };
});
