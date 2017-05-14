// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
// javascript port (c) 2011 Lazar Laszlo (lazarsoft@gmail.com)
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

goog.provide('w69b.qr.detector.AlignmentPatternFinder');
goog.require('w69b.NotFoundException');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.qr.detector.AlignmentPattern');


goog.scope(function() {
  const BitMatrix = w69b.common.BitMatrix;
  const AlignmentPattern = w69b.qr.detector.AlignmentPattern;
  const NotFoundException = w69b.NotFoundException;
  /**
   * This class attempts to find alignment patterns in a QR Code.
   * Alignment patterns look like finder
   * patterns but are smaller and appear at regular intervals throughout the
   * image.
   *
   * At the moment this only looks for the bottom-right alignment pattern.
   *
   *
   * This is mostly a simplified copy of {@link FinderPatternFinder}.
   * It is copied,
   * pasted and stripped down here for maximum performance but does
   * unfortunately duplicate
   * some code.
   *
   * This class is thread-safe but not reentrant. Each thread must allocate
   * its own object.
   *
   * @author Sean Owen
   * @author mb@w69b.com (Manuel Braun) - ported to js
   *
   * @constructor
   * @param {!BitMatrix} image image to search.
   * @param {number} startX left column from which to start searching.
   * @param {number} startY stat top row from which to start searching.
   * @param {number} width width of region to search.
   * @param {number} height height of region to search.
   * @param {number} moduleSize size module size so far.
   * @param {?w69b.ResultPointCallback} resultPointCallback callback.
   */
  w69b.qr.detector.AlignmentPatternFinder = function(image, startX, startY, width,
                                            height, moduleSize,
                                            resultPointCallback) {
    /** @type {!BitMatrix} */
    this.image = image;
    /** @type {Array.<AlignmentPattern>} */
    this.possibleCenters = [];
    this.startX = startX;
    this.startY = startY;
    this.width = width;
    this.height = height;
    this.moduleSize = moduleSize;
    this.crossCheckStateCount = Int32Array.of(0, 0, 0);
    this.resultPointCallback = resultPointCallback;
  };
  const AlignmentPatternFinder = w69b.qr.detector.AlignmentPatternFinder;
  const pro = AlignmentPatternFinder.prototype;

  /**
   * Given a count of black/white/black pixels just seen and an end position,
   * figures the location of the center of this black/white/black run.
   * @param {Int32Array} stateCount
   * @param {number} end
   * @return {number}
   */
  pro.centerFromEnd = function(stateCount, end) {
    return (end - stateCount[2]) - stateCount[1] / 2.0;
  };

  /**
   * @param {Int32Array} stateCount count of black/white/black pixels just read
   * @return {boolean} true iff the proportions of the counts is close enough to the 1/1/1 ratios
   *         used by alignment patterns to be considered a match
   */
  pro.foundPatternCross = function(stateCount) {
    var moduleSize = this.moduleSize;
    var maxVariance = moduleSize / 2.0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(moduleSize - stateCount[i]) >= maxVariance) {
        return false;
      }
    }
    return true;
  };

  /**
   * After a horizontal scan finds a potential alignment pattern, this method
   * "cross-checks" by scanning down vertically through the center of the possible
   * alignment pattern to see if the same proportion is detected.
   *
   * @param {number} startI row where an alignment pattern was detected
   * @param {number} centerJ center of the section that appears to cross an alignment pattern
   * @param {number} maxCount maximum reasonable number of modules that should be
   * observed in any reading state, based on the results of the horizontal scan
   * @param {number} originalStateCountTotal
   * @return {number} vertical center of alignment pattern, or {@link Float#NaN} if not found
   */
  pro.crossCheckVertical = function(startI, centerJ, maxCount,
                                    originalStateCountTotal) {
    var image = this.image;

    var maxI = image.getHeight();
    var stateCount = this.crossCheckStateCount;
    stateCount[0] = 0;
    stateCount[1] = 0;
    stateCount[2] = 0;

    // Start counting up from center
    var i = startI;
    while (i >= 0 && image.get(centerJ, i) &&
      stateCount[1] <= maxCount) {
      stateCount[1]++;
      i--;
    }
    // If already too many modules in this state or ran off the edge:
    if (i < 0 || stateCount[1] > maxCount) {
      return NaN;
    }
    while (i >= 0 && !image.get(centerJ, + i) &&
      stateCount[0] <= maxCount) {
      stateCount[0]++;
      i--;
    }
    if (stateCount[0] > maxCount) {
      return NaN;
    }

    // Now also count down from center
    i = startI + 1;
    while (i < maxI && image.get(centerJ, i) &&
      stateCount[1] <= maxCount) {
      stateCount[1]++;
      i++;
    }
    if (i === maxI || stateCount[1] > maxCount) {
      return NaN;
    }
    while (i < maxI && !image.get(centerJ, i) &&
      stateCount[2] <= maxCount) {
      stateCount[2]++;
      i++;
    }
    if (stateCount[2] > maxCount) {
      return NaN;
    }

    var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
    if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >=
      2 * originalStateCountTotal) {
      return NaN;
    }

    return this.foundPatternCross(stateCount) ?
      this.centerFromEnd(stateCount,
        i) : NaN;
  };

  /**
   * This method attempts to find the bottom-right alignment pattern in the
   * image. It is a bit messy since it's pretty performance-critical and so is
   * written to be fast foremost.
   *
   * @param {Int32Array} stateCount reading state module counts from horizontal scan
   * @param {number} i row where alignment pattern may be found
   * @param {number} j end of possible alignment pattern in row
   * @return {AlignmentPattern} if found
   * @throws {NotFoundException} if not found
   */
  pro.handlePossibleCenter = function(stateCount, i, j) {
    var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
    var centerJ = this.centerFromEnd(stateCount, j);
    var centerI = this.crossCheckVertical(i, Math.floor(centerJ),
      2 * stateCount[1], stateCountTotal);
    if (!isNaN(centerI)) {
      let estimatedModuleSize = (stateCount[0] + stateCount[1] +
        stateCount[2]) / 3.0;
      let max = this.possibleCenters.length;
      for (let index = 0; index < max; index++) {
        let center = this.possibleCenters[index];
        // Look for about the same center and module size:
        if (center.aboutEquals(estimatedModuleSize, centerI, centerJ)) {
          return center.combineEstimate(centerI, centerJ, estimatedModuleSize);
        }
      }
      // Hadn't found this before; save it
      let point = new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
      this.possibleCenters.push(point);
      if (this.resultPointCallback !== null) {
        this.resultPointCallback(point);
      }
    }
    return null;
  };

  /**
   * This method attempts to find the bottom-right alignment pattern in the
   * image. It is a bit messy since it's pretty performance-critical and so is
   * written to be fast foremost.
   *
   * @return {AlignmentPattern} if found
   * @throws {NotFoundException} if not found
   */
  pro.find = function() {
    var startX = this.startX;
    var height = this.height;
    var image = this.image;
    var maxJ = startX + this.width;
    var middleI = this.startY + (height >> 1);
    // We are looking for black/white/black modules in 1:1:1 ratio;
    // this tracks the number of black/white/black modules seen so far
    var stateCount = new Int32Array(3);
    for (let iGen = 0; iGen < height; iGen++) {
      // Search from middle outwards
      let i = middleI +
        ((iGen & 0x01) === 0 ? ((iGen + 1) >> 1) : -((iGen + 1) >> 1));
      stateCount[0] = 0;
      stateCount[1] = 0;
      stateCount[2] = 0;
      let j = startX;
      // Burn off leading white pixels before anything else; if we start in the
      // middle of a white run, it doesn't make sense to count its length,
      // since we don't know if the white run continued to the left of the
      // start point
      while (j < maxJ && image.get(j, i)) {
        j++;
      }
      let currentState = 0;
      while (j < maxJ) {
        if (image.get(j, i)) {
          // Black pixel
          if (currentState === 1) {
            // Counting black pixels
            stateCount[currentState]++;
          } else {
            // Counting white pixels
            if (currentState === 2) {
              // A winner?
              if (this.foundPatternCross(stateCount)) {
                // Yes
                let confirmed = this.handlePossibleCenter(stateCount, i, j);
                if (confirmed !== null) {
                  return confirmed;
                }
              }
              stateCount[0] = stateCount[2];
              stateCount[1] = 1;
              stateCount[2] = 0;
              currentState = 1;
            } else {
              stateCount[++currentState]++;
            }
          }
        } else {
          // White pixel
          if (currentState === 1) {
            // Counting black pixels
            currentState++;
          }
          stateCount[currentState]++;
        }
        j++;
      }
      if (this.foundPatternCross(stateCount)) {
        let confirmed = this.handlePossibleCenter(stateCount, i, maxJ);
        if (confirmed !== null) {
          return confirmed;
        }
      }
    }

    // Hmm, nothing we saw was observed and confirmed twice. If we had
    // any guess at all, return it.
    if (this.possibleCenters.length > 0) {
      return this.possibleCenters[0];
    }

    throw new NotFoundException();
  };
});
