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

goog.provide('w69b.multi.GenericMultipleBarcodeReader');
goog.require('java.util.ArrayList');
goog.require('w69b.BinaryBitmap');
goog.require('w69b.DecodeHintType');
goog.require('w69b.NotFoundException');
goog.require('w69b.Reader');
goog.require('w69b.ReaderException');
goog.require('w69b.Result');
goog.require('w69b.ResultPoint');
goog.require('w69b.multi.MultipleBarcodeReader');


goog.scope(function() {
  const ArrayList = java.util.ArrayList;
  const BinaryBitmap = w69b.BinaryBitmap;
  const DecodeHintType = w69b.DecodeHintType;
  const NotFoundException = w69b.NotFoundException;
  const Reader = w69b.Reader;
  const ReaderException = w69b.ReaderException;
  const Result = w69b.Result;
  const ResultPoint = w69b.ResultPoint;
  const MultipleBarcodeReader = w69b.multi.MultipleBarcodeReader;

  /**
   * Attempts to locate multiple barcodes in an image by repeatedly decoding portion of the image.
   * After one barcode is found, the areas left, above, right and below the barcode's
   * {@link ResultPoint}s are scanned, recursively.
   *
   * A caller may want to also employ {@link ByQuadrantReader} when attempting to find multiple
   * 2D barcodes, like QR Codes, in an image, where the presence of multiple barcodes might prevent
   * detecting any one of them.
   *
   * That is, instead of passing a {@link Reader} a caller might pass
   * {@code new ByQuadrantReader(reader)}.
   * @constructor
   * @param {!Reader} delegate
   * @implements {MultipleBarcodeReader}
   * @final
   */
  w69b.multi.GenericMultipleBarcodeReader = function(delegate) {
    this.delegate_ = delegate;
  };
  const pro = w69b.multi.GenericMultipleBarcodeReader.prototype;

  const MIN_DIMENSION_TO_RECUR = 100;
  const MAX_DEPTH = 4;

  /**
   * @override
   */
  pro.decodeMultiple = function(image, opt_hints) {
    /** @type {!ArrayList<!Result>} */
    const results = new ArrayList();
    this.doDecodeMultiple_(image, opt_hints ? opt_hints : null, results, 0, 0, 0);
    if (results.isEmpty()) {
      throw new NotFoundException();
    }
    return results.toArray();
  };

  /**
   * @param {!BinaryBitmap} image
   * @param {?Object<!DecodeHintType,*>} hints
   * @param {!ArrayList<!Result>} results
   * @param {number} xOffset
   * @param {number} yOffset
   * @param {number} currentDepth
   */
  pro.doDecodeMultiple_ = function(image, hints, results, xOffset, yOffset, currentDepth) {
    if (currentDepth > MAX_DEPTH) {
      return;
    }

    let result;
    try {
      result = this.delegate_.decode(image, hints);
    } catch (ignored) {
      if (ignored instanceof ReaderException) {
        return;
      }

      throw ignored;
    }
    let alreadyFound = false;
    for (let existingResult of results) {
      if (existingResult.getText() === result.getText()) {
        alreadyFound = true;
        break;
      }
    }
    if (!alreadyFound) {
      results.add(translateResultPoints(result, xOffset, yOffset));
    }
    /** @type {!Array.<!ResultPoint>} */
    const resultPoints = result.getResultPoints();
    if (resultPoints === null || resultPoints.length === 0) {
      return;
    }
    const width = image.getWidth();
    const height = image.getHeight();
    let minX = width;
    let minY = height;
    let maxX = 0.0;
    let maxY = 0.0;
    for (let point of resultPoints) {
      if (point === null) {
        continue;
      }
      const x = point.getX();
      const y = point.getY();
      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
    }

    // Decode left of barcode
    if (minX > MIN_DIMENSION_TO_RECUR) {
      this.doDecodeMultiple_(image.crop(0, 0, Math.floor(minX), height),
                       hints, results,
                       xOffset, yOffset,
                       currentDepth + 1);
    }
    // Decode above barcode
    if (minY > MIN_DIMENSION_TO_RECUR) {
      this.doDecodeMultiple_(image.crop(0, 0, width, Math.floor(minY)),
                       hints, results,
                       xOffset, yOffset,
                       currentDepth + 1);
    }
    // Decode right of barcode
    if (maxX < width - MIN_DIMENSION_TO_RECUR) {
      this.doDecodeMultiple_(image.crop(Math.floor(maxX), 0, width - Math.floor(maxX), height),
                       hints, results,
                       xOffset + Math.floor(maxX), yOffset,
                       currentDepth + 1);
    }
    // Decode below barcode
    if (maxY < height - MIN_DIMENSION_TO_RECUR) {
      this.doDecodeMultiple_(image.crop(0, Math.floor(maxY), width, height - Math.floor(maxY)),
                       hints, results,
                       xOffset, yOffset + Math.floor(maxY),
                       currentDepth + 1);
    }
  };

  /**
   * @param {!Result} result
   * @param {number} xOffset
   * @param {number} yOffset
   * @return {!Result}
   */
  function translateResultPoints(result, xOffset, yOffset) {
    /** @type {!Array.<!ResultPoint>} */
    const oldResultPoints = result.getResultPoints();
    if (oldResultPoints === null) {
      return result;
    }
    /** @type {!Array.<!ResultPoint>} */
    const newResultPoints = new Array(oldResultPoints.length);
    for (let i = 0; i < oldResultPoints.length; i++) {
      const oldPoint = oldResultPoints[i];
      if (oldPoint !== null) {
        newResultPoints[i] = new ResultPoint(oldPoint.getX() + xOffset, oldPoint.getY() + yOffset);
      }
    }
    const newResult = new Result(result.getText(),
                                 result.getRawBytes(),
                                 result.getNumBits(),
                                 newResultPoints,
                                 result.getBarcodeFormat(),
                                 result.getTimestamp());
    newResult.putAllMetadata(result.getResultMetadata());
    return newResult;
  }
});
