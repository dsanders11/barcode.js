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

goog.provide('w69b.oned.OneDReader');
goog.require('w69b.BinaryBitmap');
goog.require('w69b.ChecksumException');
goog.require('w69b.DecodeHintType');
goog.require('w69b.FormatException');
goog.require('w69b.NotFoundException');
goog.require('w69b.Reader');
goog.require('w69b.ReaderException');
goog.require('w69b.Result');
goog.require('w69b.ResultMetadataType');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitArray');


goog.scope(function() {
  const BinaryBitmap = w69b.BinaryBitmap;
  const ChecksumException = w69b.ChecksumException;
  const DecodeHintType = w69b.DecodeHintType;
  const FormatException = w69b.FormatException;
  const NotFoundException = w69b.NotFoundException;
  const Reader = w69b.Reader;
  const ReaderException = w69b.ReaderException;
  const Result = w69b.Result;
  const ResultMetadataType = w69b.ResultMetadataType;
  const ResultPoint = w69b.ResultPoint;
  const BitArray = w69b.common.BitArray;

  /**
   * Encapsulates functionality and implementation that is common to all families
   * of one-dimensional barcodes.
   * @constructor
   * @implements {Reader}
   * @abstract
   */
  w69b.oned.OneDReader = function() { };
  const OneDReader = w69b.oned.OneDReader;
  const pro = OneDReader.prototype;

  /**
   * @override
   */
  pro.decode = function(image, opt_hints) {
    try {
      return this.doDecode_(image, opt_hints ? opt_hints : null);
    } catch (err) {
      if (err instanceof NotFoundException) {
        var tryHarder = opt_hints && !!opt_hints[DecodeHintType.TRY_HARDER];
        if (tryHarder && image.isRotateSupported()) {
          let rotatedImage = image.rotateCounterClockwise();
          let result = this.doDecode_(rotatedImage, opt_hints ? opt_hints : null);
          // Record that we found it rotated 90 degrees CCW / 270 degrees CW
          let metadata = result.getResultMetadata();
          let orientation = 270;
          if (metadata !== null && !!metadata[ResultMetadataType.ORIENTATION]) {
            // But if we found it reversed in doDecode(), add in that result here:
            orientation = (orientation + metadata[ResultMetadataType.ORIENTATION]) % 360;
          }
          result.putMetadata(ResultMetadataType.ORIENTATION, orientation);
          // Update result points
          let points = result.getResultPoints();
          if (points !== null) {
            let height = rotatedImage.getHeight();
            for (let i = 0; i < points.length; i++) {
              points[i] = new ResultPoint(height - points[i].getY() - 1, points[i].getX());
            }
          }
          return result;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  };

  /**
   * @override
   */
  pro.reset = function() {
    // do nothing
  };

  /**
   * Determines how closely a set of observed counts of runs of black/white
   * values matches a given target pattern. This is reported as the ratio of the
   * total variance from the expected pattern proportions across all pattern
   * elements, to the length of the pattern.
   *
   * @param {Int32Array} counters observed counters
   * @param {Int32Array} pattern expected pattern
   * @param {number} maxIndividualVariance The most any counter can differ before we give up
   * @return {number} ratio of total variance between counters and pattern compared to total pattern size
   * @protected
   */
  OneDReader.patternMatchVariance = function(counters, pattern, maxIndividualVariance) {
    var numCounters = counters.length;
    var total = 0;
    var patternLength = 0;
    for (let i = 0; i < numCounters; i++) {
      total += counters[i];
      patternLength += pattern[i];
    }
    if (total < patternLength) {
      // If we don't even have one pixel per unit of bar width, assume this is too small
      // to reliably match, so fail:
      return Number.POSITIVE_INFINITY;
    }

    var unitBarWidth = total / patternLength;
    maxIndividualVariance *= unitBarWidth;

    var totalVariance = 0.0;
    for (let x = 0; x < numCounters; x++) {
      let counter = counters[x];
      let scaledPattern = pattern[x] * unitBarWidth;
      let variance = counter > scaledPattern ? counter - scaledPattern : scaledPattern - counter;
      if (variance > maxIndividualVariance) {
        return Number.POSITIVE_INFINITY;
      }
      totalVariance += variance;
    }
    return totalVariance / total;
  };

  /**
   * @param {BitArray} row
   * @param {number} start
   * @param {Int32Array} counters
   * @throws {NotFoundException}
   * @protected
   */
  OneDReader.recordPatternInReverse = function(row, start, counters) {
    // This could be more efficient I guess
    var numTransitionsLeft = counters.length;
    var last = row.get(start);
    while (start > 0 && numTransitionsLeft >= 0) {
      if (row.get(--start) !== last) {
        numTransitionsLeft--;
        last = !last;
      }
    }
    if (numTransitionsLeft >= 0) {
      throw new NotFoundException();
    }
    OneDReader.recordPattern(row, start + 1, counters);
  };

  /**
   * Records the size of successive runs of white and black pixels in a row,
   * starting at a given point. The values are recorded in the given array, and
   * the number of runs recorded is equal to the size of the array. If the row
   * starts on a white pixel at the given start point, then the first count
   * recorded is the run of white pixels starting from that point; likewise it
   * is the count of a run of black pixels if the row begin on a black pixels at
   * that point.
   *
   * @param {BitArray} row row to count from
   * @param {number} start offset into row to start at
   * @param {Int32Array} counters array into which to record counts
   * @throws {NotFoundException} if counters cannot be filled entirely from row before running out of pixels
   * @protected
   */
  OneDReader.recordPattern = function(row, start, counters) {
    var numCounters = counters.length;
    counters.fill(0);
    var end = row.getSize();
    if (start >= end) {
      throw new NotFoundException();
    }
    var isWhite = !row.get(start);
    var counterPosition = 0;
    var i = start;
    while (i < end) {
      if (row.get(i) ^ isWhite) { // that is, exactly one is true
        counters[counterPosition]++;
      } else {
        counterPosition++;
        if (counterPosition === numCounters) {
          break;
        } else {
          counters[counterPosition] = 1;
          isWhite = !isWhite;
        }
      }
      i++;
    }
    // If we read fully the last section of pixels and filled up our counters -- or filled
    // the last counter but ran off the side of the image, OK. Otherwise, a problem.
    if (!(counterPosition === numCounters || (counterPosition === numCounters - 1 && i === end))) {
      throw new NotFoundException();
    }
  };

  /**
   * We're going to examine rows from the middle outward, searching alternately
   * above and below the middle, and farther out each time. rowStep is the number
   * of rows between each successive attempt above and below the middle. So we'd
   * scan row middle, then middle - rowStep, then middle + rowStep, then
   * middle - (2 * rowStep), etc.
   * rowStep is bigger as the image is taller, but is always at least 1. We've
   * somewhat arbitrarily decided that moving up and down by about 1/16 of the
   * image is pretty good; we try more of the image if "trying harder".
   *
   * @param {!BinaryBitmap} image The image to decode
   * @param {Object<DecodeHintType,*>} hints Any hints that were requested
   * @return {!Result} The contents of the decoded barcode
   * @throws {NotFoundException} Any spontaneous errors which occur
   * @private
   */
  pro.doDecode_ = function(image, hints) {
    var width = image.getWidth();
    var height = image.getHeight();
    var row = new BitArray(width);

    var middle = height >> 1;
    var tryHarder = hints !== null && !!hints[DecodeHintType.TRY_HARDER];
    var rowStep = Math.max(1, height >> (tryHarder ? 8 : 5));
    var maxLines;
    if (tryHarder) {
      maxLines = height; // Look at the whole image, not just the center
    } else {
      maxLines = 15; // 15 rows spaced 1/32 apart is roughly the middle half of the image
    }

    for (let x = 0; x < maxLines; x++) {
      // Scanning from the middle out. Determine which row we're looking at next:
      let rowStepsAboveOrBelow = (x + 1) >> 1;
      let isAbove = (x & 0x01) === 0; // i.e. is x even?
      let rowNumber = Math.floor(middle + rowStep * (isAbove ? rowStepsAboveOrBelow : -rowStepsAboveOrBelow));
      if (rowNumber < 0 || rowNumber >= height) {
        // Oops, if we run off the top or bottom, stop
        break;
      }

      // Estimate black point for this row and load it:
      try {
        row = image.getBlackRow(rowNumber, row);
      } catch (err) {
        if (err instanceof NotFoundException) {
          continue;
        }
        throw err;
      }

      // While we have the image data in a BitArray, it's fairly cheap to reverse it in place to
      // handle decoding upside down barcodes.
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt === 1) { // trying again?
          row.reverse(); // reverse the row and continue
          // This means we will only ever draw result points *once* in the life of this method
          // since we want to avoid drawing the wrong points after flipping the row, and,
          // don't want to clutter with noise from every single row scan -- just the scans
          // that start on the center line.
          if (hints !== null && !!hints[DecodeHintType.NEED_RESULT_POINT_CALLBACK]) {
            //Map<DecodeHintType,Object> newHints = new EnumMap<>(DecodeHintType.class);
            let newHints = Object.assign({}, hints);
            delete newHints[DecodeHintType.NEED_RESULT_POINT_CALLBACK];
            hints = newHints;
          }
        }
        try {
          // Look for a barcode
          let result = this.decodeRow(rowNumber, row, hints);
          // We found our barcode
          if (attempt === 1) {
            // But it was upside down, so note that
            result.putMetadata(ResultMetadataType.ORIENTATION, 180);
            // And remember to flip the result points horizontally.
            let points = result.getResultPoints();
            if (points !== null) {
              points[0] = new ResultPoint(width - points[0].getX() - 1, points[0].getY());
              points[1] = new ResultPoint(width - points[1].getX() - 1, points[1].getY());
            }
          }
          return result;
        } catch (err) {
          if (err instanceof ReaderException) {
            // continue -- just couldn't decode this row
          } else {
            throw err;
          }
        }
      }
    }

    throw new NotFoundException();
  };

  /**
   * Attempts to decode a one-dimensional barcode format given a single row of
   * an image.
   *
   * @param {number} rowNumber row number from top of the row
   * @param {!BitArray} row the black/white pixel data of the row
   * @param {Object<DecodeHintType,*>} hints decode hints
   * @return {!Result} containing encoded string and start/end of barcode
   * @throws {NotFoundException} if no potential barcode is found
   * @throws {ChecksumException} if a potential barcode is found but does not pass its checksum
   * @throws {FormatException} if a potential barcode is found but format is invalid
   * @abstract
   */
  OneDReader.prototype.decodeRow = function(rowNumber, row, hints) { };
});
