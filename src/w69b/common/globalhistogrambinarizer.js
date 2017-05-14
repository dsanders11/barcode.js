// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
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

goog.provide('w69b.common.GlobalHistogramBinarizer');
goog.require('w69b.Binarizer');
goog.require('w69b.LuminanceSource');
goog.require('w69b.NotFoundException');
goog.require('w69b.common.BitArray');
goog.require('w69b.common.BitMatrix');


goog.scope(function() {
  const LuminanceSource = w69b.LuminanceSource;
  const BitMatrix = w69b.common.BitMatrix;
  const BitArray = w69b.common.BitArray;
  /**
   * This Binarizer implementation uses the old ZXing global histogram
   * approach. It is suitable for low-end mobile devices which don't have
   * enough CPU or memory to use a local thresholding algorithm. However,
   * because it picks a global black point, it cannot handle difficult shadows
   * and gradients.
   *
   * Faster mobile devices and all desktop applications should probably use
   * HybridBinarizer instead.
   *
   * @author dswitkin@google.com (Daniel Switkin)
   * @author Sean Owen
   * Ported to js by Manuel Braun
   *
   * @param {LuminanceSource} source gray values.
   * @constructor
   * @extends {w69b.Binarizer}
   */
  w69b.common.GlobalHistogramBinarizer = function(source) {
    goog.base(this, source);
    /**
     * @type {Int8Array}
     * @private
     */
    this.luminances_ = new Int8Array(0);
    /**
     * @type {Uint8Array}
     * @private
     */
    this.buckets_ = new Uint8Array(LUMINANCE_BUCKETS);
  };
  const _ = w69b.common.GlobalHistogramBinarizer;
  goog.inherits(_, w69b.Binarizer);
  const pro = _.prototype;

  const LUMINANCE_BITS = 5;
  const LUMINANCE_SHIFT = 8 - LUMINANCE_BITS;
  const LUMINANCE_BUCKETS = 1 << LUMINANCE_BITS;

  /**
   * Applies simple sharpening to the row data to improve performance of the 1D
   * Readers.
   * @override
   */
  pro.getBlackRow = function(y, row) {
    var source = this.getLuminanceSource();
    var width = source.getWidth();
    if (row === null || row.getSize() < width) {
      row = new BitArray(width);
    } else {
      row.clear();
    }

    this.initArrays(width);
    var localLuminances = source.getRow(y, this.luminances_);
    var localBuckets = this.buckets_;
    for (let x = 0; x < width; x++) {
      let pixel = localLuminances[x] & 0xff;
      localBuckets[pixel >> LUMINANCE_SHIFT]++;
    }
    var blackPoint = _.estimateBlackPoint(localBuckets);

    var left = localLuminances[0] & 0xff;
    var center = localLuminances[1] & 0xff;
    for (let x = 1; x < width - 1; x++) {
      let right = localLuminances[x + 1] & 0xff;
      // A simple -1 4 -1 box filter with a weight of 2.
      let luminance = ((center << 2) - left - right) >> 1;
      if (luminance < blackPoint) {
        row.set(x);
      }
      left = center;
      center = right;
    }
    return row;
  };

  /**
   * Does not sharpen the data, as this call is intended to only be used by
   * 2D Readers.
   * @override
   */
  pro.getBlackMatrix = function() {
    var source = this.getLuminanceSource();
    var width = source.getWidth();
    var height = source.getHeight();
    var matrix = new BitMatrix(width, height);

    // Quickly calculates the histogram by sampling four rows from the image.
    // This proved to be more robust on the blackbox tests than sampling a
    // diagonal as we used to do.
    this.initArrays(width);
    var localBuckets = this.buckets_;
    for (let y = 1; y < 5; y++) {
      let row = height * y / 5;
      let localLuminances = source.getRow(row, this.luminances_);
      let right = (width << 2) / 5;
      for (let x = width / 5; x < right; x++) {
        let pixel = localLuminances[x] & 0xff;
        localBuckets[pixel >> LUMINANCE_SHIFT]++;
      }
    }
    var blackPoint = _.estimateBlackPoint(localBuckets);

    // We delay reading the entire image luminance until the black point
    // estimation succeeds.  Although we end up reading four rows twice, it
    // is consistent with our motto of "fail quickly" which is necessary for
    // continuous scanning.
    var localLuminances = source.getMatrix();
    for (let y = 0; y < height; y++) {
      let  offset = y * width;
      for (let x = 0; x < width; x++) {
        let pixel = localLuminances[offset + x] & 0xff;
        if (pixel < blackPoint) {
          matrix.set(x, y);
        }
      }
    }

    return matrix;
  };

  /**
   * @override
   */
  pro.createBinarizer = function(source) {
    return new _(source);
  };

  /**
   * @param {number} luminanceSize
   */
  pro.initArrays = function(luminanceSize) {
    if (this.luminances_.length < luminanceSize) {
      this.luminances_ = new Int8Array(luminanceSize);
    }
    this.buckets_.fill(0);
  };

  /**
   * @param {Uint8Array} buckets
   * @return {number}
   */
  _.estimateBlackPoint = function(buckets) {
    // Find the tallest peak in the histogram.
    var numBuckets = buckets.length;
    var maxBucketCount = 0;
    var firstPeak = 0;
    var firstPeakSize = 0;
    for (let x = 0; x < numBuckets; x++) {
      if (buckets[x] > firstPeakSize) {
        firstPeak = x;
        firstPeakSize = buckets[x];
      }
      if (buckets[x] > maxBucketCount) {
        maxBucketCount = buckets[x];
      }
    }

    // Find the second-tallest peak which is somewhat far from the tallest
    // peak.
    var secondPeak = 0;
    var secondPeakScore = 0;
    for (let x = 0; x < numBuckets; x++) {
      let distanceToBiggest = x - firstPeak;
      // Encourage more distant second peaks by multiplying by square of
      // distance.
      let score = buckets[x] * distanceToBiggest * distanceToBiggest;
      if (score > secondPeakScore) {
        secondPeak = x;
        secondPeakScore = score;
      }
    }

    // Make sure firstPeak corresponds to the black peak.
    if (firstPeak > secondPeak) {
      let temp = firstPeak;
      firstPeak = secondPeak;
      secondPeak = temp;
    }

    // If there is too little contrast in the image to pick a meaningful
    // black point, throw rather than waste time trying to decode the image,
    // and risk false positives.
    if (secondPeak - firstPeak <= numBuckets >> 4) {
      throw new w69b.NotFoundException();
    }

    // Find a valley between them that is low and closer to the white peak.
    var bestValley = secondPeak - 1;
    var bestValleyScore = -1;
    for (let x = secondPeak - 1; x > firstPeak; x--) {
      let fromFirst = x - firstPeak;
      let score = fromFirst * fromFirst * (secondPeak - x) *
        (maxBucketCount - buckets[x]);
      if (score > bestValleyScore) {
        bestValley = x;
        bestValleyScore = score;
      }
    }

    return bestValley << LUMINANCE_SHIFT;
  };
});
