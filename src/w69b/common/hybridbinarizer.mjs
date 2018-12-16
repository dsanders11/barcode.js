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

import { BitMatrix } from './bitmatrix.mjs';
import { GlobalHistogramBinarizer } from './globalhistogrambinarizer.mjs';

goog.declareModuleId('es6.w69b.common.HybridBinarizer');

// This class uses 5x5 blocks to compute local luminance, where each block is
// 8x8 pixels. So this is the smallest dimension in each axis we can accept.
const BLOCK_SIZE_POWER = 3;
const BLOCK_SIZE = 1 << BLOCK_SIZE_POWER; // ...0100...00
const BLOCK_SIZE_MASK = BLOCK_SIZE - 1;   // ...0011...11
const MINIMUM_DIMENSION = BLOCK_SIZE * 5;
const MIN_DYNAMIC_RANGE = 24;

/**
 * This class implements a local thresholding algorithm, which while slower
 * than the GlobalHistogramBinarizer, is fairly efficient for what it does.
 * It is designed for high frequency images of barcodes with black data on
 * white backgrounds. For this application, it does a much better job than a
 * global blackpoint with severe shadows and gradients.  However it tends to
 * produce artifacts on lower frequency images and is therefore not a good
 * general purpose binarizer for uses outside ZXing.
 *
 * This class extends GlobalHistogramBinarizer, using the older histogram
 * approach for 1D readers, and the newer local approach for 2D readers. 1D
 * decoding using a per-row histogram is already inherently local, and only
 * fails for horizontal gradients. We can revisit that problem later, but for
 * now it was not a win to use local blocks for 1D.
 *
 * This Binarizer is the default for the unit tests and the recommended class
 * for library users.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * ported to js by Manuel Braun
 */
export class HybridBinarizer extends GlobalHistogramBinarizer {
  /**
   * @param {!w69b.LuminanceSource} source gray values.
   */
  constructor(source) {
    super(source);

    /**
     * @private
     * @type {?BitMatrix}
     */
    this.matrix_ = null;
  }

  /**
   * Calculates the final BitMatrix once for all requests. This could be called
   * once from the constructor instead, but there are some advantages to doing
   * it lazily, such as making profiling easier, and not doing heavy lifting
   * when callers don't expect it.
   * @override
   */
  getBlackMatrix() {
    if (this.matrix_ !== null) {
      return this.matrix_;
    }
    const source = this.getLuminanceSource();
    const width = source.getWidth();
    const height = source.getHeight();
    if (width >= MINIMUM_DIMENSION && height >= MINIMUM_DIMENSION) {
      const luminances = source.getMatrix();
      // dived by 8
      let subWidth = width >> BLOCK_SIZE_POWER;
      // only even numbers
      if ((width & BLOCK_SIZE_MASK) !== 0) {
        subWidth++;
      }
      let subHeight = height >> BLOCK_SIZE_POWER;
      if ((height & BLOCK_SIZE_MASK) !== 0) {
        subHeight++;
      }
      const blackPoints = HybridBinarizer.calculateBlackPoints(
        luminances, subWidth, subHeight, width, height);

      const newMatrix = new BitMatrix(width, height);
      HybridBinarizer.calculateThresholdForBlock(luminances, subWidth, subHeight,
        width, height, blackPoints, newMatrix);
      this.matrix_ = newMatrix;
    } else {
      // If the image is too small, fall back to the global histogram approach.
      this.matrix_ = super.getBlackMatrix();
    }
    return this.matrix_;
  }

  /**
   * @override
   */
  createBinarizer(source) {
    return new HybridBinarizer(source);
  }

  /**
   * For each block in the image, calculate the average black point using a 5x5
   * grid of the blocks around it. Also handles the corner cases (fractional
   * blocks are computed based on the last pixels in the row/column which are
   * also used in the previous block).
   * @param {!Int8Array} luminances
   * @param {number} subWidth
   * @param {number} subHeight
   * @param {number} width
   * @param {number} height
   * @param {!Array.<!Int32Array>} blackPoints
   * @param {!BitMatrix} matrix
   */
  static calculateThresholdForBlock(luminances, subWidth, subHeight,
                                    width, height, blackPoints, matrix) {
    const maxYOffset = height - BLOCK_SIZE;
    const maxXOffset = width - BLOCK_SIZE;
    for (let y = 0; y < subHeight; y++) {
      const top = HybridBinarizer.cap(y, 2, subHeight - 3);
      let yoffset = y << BLOCK_SIZE_POWER;
      if (yoffset > maxYOffset) {
        yoffset = maxYOffset;
      }
      for (let x = 0; x < subWidth; x++) {
        let xoffset = x << BLOCK_SIZE_POWER;
        if (xoffset > maxXOffset) {
          xoffset = maxXOffset;
        }
        const left = HybridBinarizer.cap(x, 2, subWidth - 3);
        let sum = 0;
        for (let z = -2; z <= 2; z++) {
          const blackRow = blackPoints[top + z];
          sum += blackRow[left - 2] + blackRow[left - 1] +
            blackRow[left] + blackRow[left + 1] + blackRow[left + 2];
        }
        const average = Math.floor(sum / 25);
        HybridBinarizer.thresholdBlock(
          luminances, xoffset, yoffset, average, width, matrix);
      }
    }
  }

  /**
   * @param {number} value value.
   * @param {number} min min.
   * @param {number} max max.
   * @return {number} capped value.
   */
  static cap(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  /**
   * Applies a single threshold to a block of pixels.
   * @param {!Int8Array} luminances
   * @param {number} xoffset
   * @param {number} yoffset
   * @param {number} threshold
   * @param {number} stride
   * @param {!BitMatrix} matrix
   */
  static thresholdBlock(luminances, xoffset, yoffset, threshold, stride, matrix) {
    for (let y = 0, offset = yoffset * stride + xoffset; y < BLOCK_SIZE;
         y++, offset += stride) {
      const yCoord = yoffset + y;
      for (let x = 0; x < BLOCK_SIZE; x++) {
        // Comparison needs to be <= so that black == 0 pixels are
        // black even if the threshold is 0.
        if ((luminances[offset + x] & 0xFF) <= threshold) {
          matrix.set(xoffset + x, yCoord);
        }
      }
    }
  }

  /**
   * Calculates a single black point for each block of pixels and saves it away.
   * See the following thread for a discussion of this algorithm:
   *  http://groups.google.com/group/zxing/browse_thread/thread/d06efa2c35a7ddc0
   * @param {!Int8Array} luminances
   * @param {number} subWidth
   * @param {number} subHeight
   * @param {number} width
   * @param {number} height
   * @return !{Array.<!Int32Array>} the black points
   */
  static calculateBlackPoints(luminances, subWidth, subHeight, width, height) {
    /** @type {!Array.<!Int32Array>} */
    const blackPoints = Array.from({length: subHeight}, x => new Int32Array(subWidth));
    const maxXOffset = width - BLOCK_SIZE;
    const maxYOffset = height - BLOCK_SIZE;
    for (let y = 0; y < subHeight; y++) {
      let yoffset = y << BLOCK_SIZE_POWER;
      if (yoffset > maxYOffset) {
        yoffset = maxYOffset;
      }
      for (let x = 0; x < subWidth; x++) {
        let xoffset = x << BLOCK_SIZE_POWER;
        if (xoffset > maxXOffset) {
          xoffset = maxXOffset;
        }
        let sum = 0;
        let min = 0xFF;
        let max = 0;
        for (let yy = 0, offset = yoffset * width + xoffset;
             yy < BLOCK_SIZE; yy++, offset += width) {
          for (let xx = 0; xx < BLOCK_SIZE; xx++) {
            let pixel = luminances[offset + xx] & 0xFF;
            sum += pixel;
            // still looking for good contrast
            if (pixel < min) {
              min = pixel;
            }
            if (pixel > max) {
              max = pixel;
            }
          }
          // short-circuit min/max tests once dynamic range is met
          if (max - min > MIN_DYNAMIC_RANGE) {
            // finish the rest of the rows quickly
            for (yy++, offset += width;
                 yy < BLOCK_SIZE; yy++, offset += width) {
              for (let xx = 0; xx < BLOCK_SIZE; xx++) {
                sum += luminances[offset + xx] & 0xFF;
              }
            }
          }
        }

        // The default estimate is the average of the values in the block.
        let average = sum >> (BLOCK_SIZE_POWER * 2);
        if (max - min <= MIN_DYNAMIC_RANGE) {
          // If variation within the block is low, assume this is a block with
          // only light or only dark pixels. In that case we do not want to use
          // the average, as it would divide this low contrast area into black
          // and white pixels, essentially creating data out of noise.
          //
          // The default assumption is that the block is light/background.
          // Since no estimate for the level of dark pixels exists locally, use
          // half the min for the block.
          average = min >> 1;

          if (y > 0 && x > 0) {
            // Correct the "white background" assumption for blocks that have
            // neighbors by comparing the pixels in this block to the
            // previously calculated black points. This is based on the fact
            // that dark barcode symbology is always surrounded by some amount
            // of light background for which reasonable black point estimates
            // were made. The bp estimated at the boundaries is used for the
            // interior.

            // The (min < bp) is arbitrary but works better than other
            // heuristics that were tried.
            let averageNeighborBlackPoint = (blackPoints[y - 1][x] +
              (2 * blackPoints[y][x - 1]) + blackPoints[y - 1][x - 1]) >> 2;
            if (min < averageNeighborBlackPoint) {
              average = averageNeighborBlackPoint;
            }
          }
        }
        blackPoints[y][x] = average;
      }
    }
    return blackPoints;
  }
}