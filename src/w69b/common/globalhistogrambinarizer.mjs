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

import { Binarizer } from '/w69b/binarizer.mjs';
import { BitArray } from './bitarray.mjs';
import { BitMatrix } from './bitmatrix.mjs';

goog.declareModuleId('es6.w69b.common.GlobalHistogramBinarizer');

const NotFoundException = goog.require('w69b.NotFoundException');

const LUMINANCE_BITS = 5;
const LUMINANCE_SHIFT = 8 - LUMINANCE_BITS;
const LUMINANCE_BUCKETS = 1 << LUMINANCE_BITS;

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
 */
export class GlobalHistogramBinarizer extends Binarizer {
  /**
   * @param {!w69b.LuminanceSource} source gray values.
   */
  constructor(source) {
    super(source);

    /**
     * @type {!Int8Array}
     * @private
     */
    this.luminances_ = new Int8Array(0);
    /**
     * @type {!Uint8Array}
     * @private
     */
    this.buckets_ = new Uint8Array(LUMINANCE_BUCKETS);
  }

  /**
   * Applies simple sharpening to the row data to improve performance of the 1D
   * Readers.
   * @override
   */
  getBlackRow(y, row) {
    const source = this.getLuminanceSource();
    const width = source.getWidth();
    if (row === null || row.getSize() < width) {
      row = new BitArray(width);
    } else {
      row.clear();
    }

    this.initArrays(width);
    const localLuminances = source.getRow(y, this.luminances_);
    const localBuckets = this.buckets_;
    for (let x = 0; x < width; x++) {
      const pixel = localLuminances[x] & 0xff;
      localBuckets[pixel >> LUMINANCE_SHIFT]++;
    }
    const blackPoint = GlobalHistogramBinarizer.estimateBlackPoint(localBuckets);

    let left = localLuminances[0] & 0xff;
    let center = localLuminances[1] & 0xff;
    for (let x = 1; x < width - 1; x++) {
      const right = localLuminances[x + 1] & 0xff;
      // A simple -1 4 -1 box filter with a weight of 2.
      const luminance = ((center << 2) - left - right) >> 1;
      if (luminance < blackPoint) {
        row.set(x);
      }
      left = center;
      center = right;
    }
    return row;
  }

  /**
   * Does not sharpen the data, as this call is intended to only be used by
   * 2D Readers.
   * @override
   */
  getBlackMatrix() {
    const source = this.getLuminanceSource();
    const width = source.getWidth();
    const height = source.getHeight();
    const matrix = new BitMatrix(width, height);

    // Quickly calculates the histogram by sampling four rows from the image.
    // This proved to be more robust on the blackbox tests than sampling a
    // diagonal as we used to do.
    this.initArrays(width);
    const localBuckets = this.buckets_;
    for (let y = 1; y < 5; y++) {
      const row = height * y / 5;
      const localLuminances = source.getRow(row, this.luminances_);
      const right = (width << 2) / 5;
      for (let x = width / 5; x < right; x++) {
        const pixel = localLuminances[x] & 0xff;
        localBuckets[pixel >> LUMINANCE_SHIFT]++;
      }
    }
    const blackPoint = GlobalHistogramBinarizer.estimateBlackPoint(localBuckets);

    // We delay reading the entire image luminance until the black point
    // estimation succeeds.  Although we end up reading four rows twice, it
    // is consistent with our motto of "fail quickly" which is necessary for
    // continuous scanning.
    const localLuminances = source.getMatrix();
    for (let y = 0; y < height; y++) {
      const  offset = y * width;
      for (let x = 0; x < width; x++) {
        const pixel = localLuminances[offset + x] & 0xff;
        if (pixel < blackPoint) {
          matrix.set(x, y);
        }
      }
    }

    return matrix;
  }

  /**
   * @override
   */
  createBinarizer(source) {
    return new GlobalHistogramBinarizer(source);
  }

  /**
   * @param {number} luminanceSize
   */
  initArrays(luminanceSize) {
    if (this.luminances_.length < luminanceSize) {
      this.luminances_ = new Int8Array(luminanceSize);
    }
    this.buckets_.fill(0);
  }

  /**
   * @param {!Uint8Array} buckets
   * @return {number}
   */
  static estimateBlackPoint(buckets) {
    // Find the tallest peak in the histogram.
    const numBuckets = buckets.length;
    let maxBucketCount = 0;
    let firstPeak = 0;
    let firstPeakSize = 0;
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
    let secondPeak = 0;
    let secondPeakScore = 0;
    for (let x = 0; x < numBuckets; x++) {
      const distanceToBiggest = x - firstPeak;
      // Encourage more distant second peaks by multiplying by square of
      // distance.
      const score = buckets[x] * distanceToBiggest * distanceToBiggest;
      if (score > secondPeakScore) {
        secondPeak = x;
        secondPeakScore = score;
      }
    }

    // Make sure firstPeak corresponds to the black peak.
    if (firstPeak > secondPeak) {
      const temp = firstPeak;
      firstPeak = secondPeak;
      secondPeak = temp;
    }

    // If there is too little contrast in the image to pick a meaningful
    // black point, throw rather than waste time trying to decode the image,
    // and risk false positives.
    if (secondPeak - firstPeak <= numBuckets >> 4) {
      throw NotFoundException.getNotFoundInstance();
    }

    // Find a valley between them that is low and closer to the white peak.
    let bestValley = secondPeak - 1;
    let bestValleyScore = -1;
    for (let x = secondPeak - 1; x > firstPeak; x--) {
      const fromFirst = x - firstPeak;
      const score = fromFirst * fromFirst * (secondPeak - x) *
        (maxBucketCount - buckets[x]);
      if (score > bestValleyScore) {
        bestValley = x;
        bestValleyScore = score;
      }
    }

    return bestValley << LUMINANCE_SHIFT;
  }
}
