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

goog.provide('w69b.qr.QRCodeWriter');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.EncodeHintType');
goog.require('w69b.Integer');
goog.require('w69b.Writer');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.exceptions.IllegalArgumentException');
goog.require('w69b.exceptions.IllegalStateException');
goog.require('w69b.qr.decoder.ErrorCorrectionLevel');
goog.require('w69b.qr.encoder.Encoder');
goog.require('w69b.qr.encoder.QRCode');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const EncodeHintType = w69b.EncodeHintType;
  const Integer = w69b.Integer;
  const IllegalArgumentException = w69b.exceptions.IllegalArgumentException;
  const IllegalStateException = w69b.exceptions.IllegalStateException;
  const Writer = w69b.Writer;
  const BitMatrix = w69b.common.BitMatrix;
  const ErrorCorrectionLevel = w69b.qr.decoder.ErrorCorrectionLevel;
  const Encoder = w69b.qr.encoder.Encoder;
  const QRCode = w69b.qr.encoder.QRCode;

  /**
   * This object renders a QR Code as a BitMatrix 2D array of greyscale values.
   * @constructor
   * @implements {Writer}
   * @final
   */
  w69b.qr.QRCodeWriter = function() { };
  const QRCodeWriter = w69b.qr.QRCodeWriter;
  const pro = QRCodeWriter.prototype;

  const QUIET_ZONE_SIZE = 4;

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (contents.length === 0) {
      throw new IllegalArgumentException("Found empty contents");
    }

    if (format !== BarcodeFormat.QR_CODE) {
      throw new IllegalArgumentException("Can only encode QR_CODE, but got " + format);
    }

    if (width < 0 || height < 0) {
      throw new IllegalArgumentException("Requested dimensions are too small: " + width + 'x' + height);
    }

    var errorCorrectionLevel = ErrorCorrectionLevel.L;
    var quietZone = QUIET_ZONE_SIZE;
    if (opt_hints) {
      if (!!opt_hints[EncodeHintType.ERROR_CORRECTION]) {
        errorCorrectionLevel = ErrorCorrectionLevel.getByName(opt_hints[EncodeHintType.ERROR_CORRECTION].toString());
      }
      if (!!opt_hints[EncodeHintType.MARGIN]) {
        quietZone = Integer.parseInt(opt_hints[EncodeHintType.MARGIN]);
      }
    }

    var code = Encoder.encode(contents, errorCorrectionLevel, opt_hints);
    return renderResult(code, width, height, quietZone);
  };

  /**
   * Note that the input matrix uses 0 == white, 1 == black, while the output
   * matrix uses 0 == black, 255 == white (i.e. an 8 bit greyscale bitmap).
   * @param {QRCode} code
   * @param {number} width
   * @param {number} height
   * @param {number} quietZone
   * @return {!BitMatrix}
   * @throws {IllegalStateException}
   */
  function renderResult(code, width, height, quietZone) {
    var input = code.getMatrix();
    if (input === null) {
      throw new IllegalStateException();
    }
    var inputWidth = input.getWidth();
    var inputHeight = input.getHeight();
    var qrWidth = inputWidth + (quietZone << 1);
    var qrHeight = inputHeight + (quietZone << 1);
    var outputWidth = Math.max(width, qrWidth);
    var outputHeight = Math.max(height, qrHeight);

    var multiple = Math.floor(Math.min(outputWidth / qrWidth, outputHeight / qrHeight));
    // Padding includes both the quiet zone and the extra white pixels to accommodate
    // the requested dimensions. For example, if input is 25x25 the QR will be
    // 33x33 including the quiet zone. If the requested size is 200x160, the
    // multiple will be 4, for a QR of 132x132. These will handle all the padding
    // from 100x100 (the actual QR) up to 200x160.
    var leftPadding = (outputWidth - (inputWidth * multiple)) >> 1;
    var topPadding = (outputHeight - (inputHeight * multiple)) >> 1;

    var output = new BitMatrix(outputWidth, outputHeight);

    for (let inputY = 0, outputY = topPadding; inputY < inputHeight; inputY++, outputY += multiple) {
      // Write the contents of this row of the barcode
      for (let inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
        if (input.get(inputX, inputY) === 1) {
          output.setRegion(outputX, outputY, multiple, multiple);
        }
      }
    }

    return output;
  }
});
