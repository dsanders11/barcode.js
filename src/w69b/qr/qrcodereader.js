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

goog.provide('w69b.qr.QRCodeReader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.DecodeHintType');
goog.require('w69b.NotFoundException');
goog.require('w69b.Reader');
goog.require('w69b.Result');
goog.require('w69b.ResultMetadataType');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.common.DecoderResult');
goog.require('w69b.qr.decoder.Decoder');
goog.require('w69b.qr.decoder.QRCodeDecoderMetaData');
goog.require('w69b.qr.detector.Detector');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const DecodeHintType = w69b.DecodeHintType;
  const NotFoundException = w69b.NotFoundException;
  const Reader = w69b.Reader;
  const Result = w69b.Result;
  const ResultMetadataType = w69b.ResultMetadataType;
  const ResultPoint = w69b.ResultPoint;
  const BitMatrix = w69b.common.BitMatrix;
  const DecoderResult = w69b.common.DecoderResult;
  const QRCodeDecoderMetaData = w69b.qr.decoder.QRCodeDecoderMetaData;
  const Decoder = w69b.qr.decoder.Decoder;
  const Detector = w69b.qr.detector.Detector;

  /**
   * This implementation can detect and decode QR Codes in an image.
   * @constructor
   * @implements {Reader}
   * @final
   */
  w69b.qr.QRCodeReader = function() { };
  const QRCodeReader = w69b.qr.QRCodeReader;
  const pro = QRCodeReader.prototype;

  /**
   * @type {!Array.<!ResultPoint>}
   */
  const NO_POINTS = [];

  /**
   * @private
   */
  const decoder = new Decoder();

  /**
   * @return {!Decoder}
   * @protected
   * @final
   */
  pro.getDecoder = function() {
    return decoder;
  };

  /**
   * Locates and decodes a QR code in an image.
   * @override
   * @final
   */
  pro.decode = function(image, opt_hints) {
    /** @type {?DecoderResult} */
    var decoderResult;
    /** @type {?Array.<!ResultPoint>} */
    var points;
    if (opt_hints && !!opt_hints[DecodeHintType.PURE_BARCODE]) {
      let bits = extractPureBits_(image.getBlackMatrix());
      decoderResult = decoder.decode(bits, opt_hints);
      points = NO_POINTS;
    } else {
      let detectorResult = new Detector(image.getBlackMatrix()).detect(opt_hints);
      decoderResult = decoder.decode(detectorResult.getBits(), opt_hints);
      points = detectorResult.getPoints();
    }

    // If the code was mirrored: swap the bottom-left and the top-right points.
    if (decoderResult.getOther() instanceof QRCodeDecoderMetaData) {
      //((QRCodeDecoderMetaData) decoderResult.getOther()).applyMirroredCorrection(points);
      decoderResult.getOther().applyMirroredCorrection(points);
    }

    var result = new Result(decoderResult.getText(), decoderResult.getRawBytes(), points, BarcodeFormat.QR_CODE);
    var byteSegments = decoderResult.getByteSegments();
    if (byteSegments !== null) {
      result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);
    }
    var ecLevel = decoderResult.getECLevel();
    if (ecLevel !== null) {
      result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
    }
    if (decoderResult.hasStructuredAppend()) {
      result.putMetadata(ResultMetadataType.STRUCTURED_APPEND_SEQUENCE,
                         decoderResult.getStructuredAppendSequenceNumber());
      result.putMetadata(ResultMetadataType.STRUCTURED_APPEND_PARITY,
                         decoderResult.getStructuredAppendParity());
    }
    return result;
  };

  /**
   * @override
   */
  pro.reset = function() {
    // do nothing
  };

  /**
   * This method detects a code in a "pure" image -- that is, pure monochrome
   * image which contains only an unrotated, unskewed, image of a code, with
   * some white border around it. This is a specialized method that works
   * exceptionally fast in this special case.
   *
   * @see com.google.zxing.datamatrix.DataMatrixReader#extractPureBits(BitMatrix)
   * @param {!BitMatrix} image
   * @return {!BitMatrix}
   * @throws {!NotFoundException}
   * @private
   */
  function extractPureBits_(image) {
    var leftTopBlack = image.getTopLeftOnBit();
    var rightBottomBlack = image.getBottomRightOnBit();
    if (leftTopBlack === null || rightBottomBlack === null) {
      throw new NotFoundException();
    }

    var moduleSize = moduleSize_(leftTopBlack, image);

    var top = leftTopBlack[1];
    var bottom = rightBottomBlack[1];
    var left = leftTopBlack[0];
    var right = rightBottomBlack[0];

    // Sanity check!
    if (left >= right || top >= bottom) {
      throw new NotFoundException();
    }

    if (bottom - top !== right - left) {
      // Special case, where bottom-right module wasn't black so we found
      // something else in the last row
      // Assume it's a square, so use height as the width
      right = left + (bottom - top);
      if (right >= image.getWidth()) {
        // Abort if that would not make sense -- off image
        throw new NotFoundException();
      }
    }

    var matrixWidth = Math.round((right - left + 1) / moduleSize);
    var matrixHeight = Math.round((bottom - top + 1) / moduleSize);
    if (matrixWidth <= 0 || matrixHeight <= 0) {
      throw new NotFoundException();
    }
    if (matrixHeight !== matrixWidth) {
      // Only possibly decode square regions
      throw new NotFoundException();
    }

    // Push in the "border" by half the module width so that we start
    // sampling in the middle of the module. Just in case the image is a
    // little off, this will help recover.
    var nudge = moduleSize >> 1;
    top += nudge;
    left += nudge;

    // But careful that this does not sample off the edge
    // "right" is the farthest-right valid pixel location -- right+1 is not necessarily
    // This is positive by how much the inner x loop below would be too large
    var nudgedTooFarRight = left + Math.floor((matrixWidth - 1) * moduleSize) - right;
    if (nudgedTooFarRight > 0) {
      if (nudgedTooFarRight > nudge) {
        // Neither way fits; abort
        throw new NotFoundException();
      }
      left -= nudgedTooFarRight;
    }
    // See logic above
    var nudgedTooFarDown = top + Math.floor((matrixHeight - 1) * moduleSize) - bottom;
    if (nudgedTooFarDown > 0) {
      if (nudgedTooFarDown > nudge) {
        // Neither way fits; abort
        throw new NotFoundException();
      }
      top -= nudgedTooFarDown;
    }

    // Now just read off the bits
    var bits = new BitMatrix(matrixWidth, matrixHeight);
    for (let y = 0; y < matrixHeight; y++) {
      let iOffset = top + Math.floor(y * moduleSize);
      for (let x = 0; x < matrixWidth; x++) {
        if (image.get(left + Math.floor(x * moduleSize), iOffset)) {
          bits.set(x, y);
        }
      }
    }
    return bits;
  }

  /**
   * @param {!Int32Array} leftTopBlack
   * @param {!BitMatrix} image
   * @return {number}
   * @throws {!NotFoundException}
   * @private
   */
  function moduleSize_(leftTopBlack, image){
    var height = image.getHeight();
    var width = image.getWidth();
    var x = leftTopBlack[0];
    var y = leftTopBlack[1];
    var inBlack = true;
    var transitions = 0;
    while (x < width && y < height) {
      if (inBlack !== image.get(x, y)) {
        if (++transitions === 5) {
          break;
        }
        inBlack = !inBlack;
      }
      x++;
      y++;
    }
    if (x === width || y === height) {
      throw new NotFoundException();
    }
    return (x - leftTopBlack[0]) / 7.0;
  }
});
