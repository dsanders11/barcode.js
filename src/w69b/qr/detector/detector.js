// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
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

goog.provide('w69b.qr.detector.Detector');
goog.require('w69b.DecodeHintType');
goog.require('w69b.NotFoundException');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.common.DefaultGridSampler');
goog.require('w69b.common.DetectorResult');
goog.require('w69b.common.GridSampler');
goog.require('w69b.common.PerspectiveTransform');
goog.require('w69b.common.detector.MathUtils');
goog.require('w69b.qr.decoder.Version');
goog.require('w69b.qr.detector.AlignmentPattern');
goog.require('w69b.qr.detector.AlignmentPatternFinder');
goog.require('w69b.qr.detector.FinderPatternFinder');
goog.require('w69b.qr.detector.FinderPatternInfo');


goog.scope(function() {
  var Version = w69b.qr.decoder.Version;
  var PerspectiveTransform = w69b.common.PerspectiveTransform;
  var NotFoundException = w69b.NotFoundException;
  var MathUtils = w69b.common.detector.MathUtils;
  var AlignmentPattern = w69b.qr.detector.AlignmentPattern;
  var DetectorResult = w69b.common.DetectorResult;
  var GridSampler = w69b.common.GridSampler;
  var DecodeHintType = w69b.DecodeHintType;
  var ResultPoint = w69b.ResultPoint;
  var BitMatrix = w69b.common.BitMatrix;

  // set default grid sampler.
  GridSampler.setGridSampler(new w69b.common.DefaultGridSampler());

  /**
   * Encapsulates logic that can detect a QR Code in an image, even if the
   * QR Code is rotated or skewed, or partially obscured.
   *
   * @author Sean Owen
   * @author mb@w69b.com (Manuel Braun) - ported to js
   *
   * @constructor
   * @param {!BitMatrix} image the image.
   * @param {?w69b.ResultPointCallback=} opt_callback callback.
   */
  w69b.qr.detector.Detector = function(image, opt_callback) {
    /**
     * @type {!BitMatrix}
     */
    this.image = image;
    this.resultPointCallback = null;
    //this.resultPointCallback = opt_callback || null;
  };
  var pro = w69b.qr.detector.Detector.prototype;

  /**
   * This method traces a line from a point in the image, in the direction
   * towards another point.
   * It begins in a black region, and keeps going until it finds white, then
   * black, then white again.
   * It reports the distance from the start to this point.
   *
   * This is used when figuring out how wide a finder pattern is, when the
   * finder pattern may be skewed or rotated.
   *
   * @param {number} fromX
   * @param {number} fromY
   * @param {number} toX
   * @param {number} toY
   * @return {number}
   */
  pro.sizeOfBlackWhiteBlackRun = function(fromX, fromY, toX, toY) {
    // Mild variant of Bresenham's algorithm;
    // see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
    var steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);
    if (steep) {
      var temp = fromX;
      fromX = fromY;
      fromY = temp;
      temp = toX;
      toX = toY;
      toY = temp;
    }

    var dx = Math.abs(toX - fromX);
    var dy = Math.abs(toY - fromY);
    var error = -dx >> 1;
    var xstep = fromX < toX ? 1 : -1;
    var ystep = fromY < toY ? 1 : -1;

    // In black pixels, looking for white, first or second time.
    var state = 0;
    // Loop up until x == toX, but not beyond
    var xLimit = toX + xstep;
    for (let x = fromX, y = fromY; x != xLimit; x += xstep) {
      let realX = steep ? y : x;
      let realY = steep ? x : y;

      // Does current pixel mean we have moved white to black or vice versa?
      // Scanning black in state 0,2 and white in state 1, so if we find
      // the wrong
      // color, advance to next state or end if we are in state 2 already
      if ((state == 1) == !!this.image.get(realX, realY)) {
        if (state == 2) {
          return MathUtils.distance(x, y, fromX, fromY);
        }
        state++;
      }

      error += dy;
      if (error > 0) {
        if (y == toY) {
          break;
        }
        y += ystep;
        error -= dx;
      }
    }
    // Found black-white-black; give the benefit of the doubt that the next
    // pixel outside the image
    // is "white" so this last point at (toX+xStep,toY) is the right ending.
    // This is really a
    // small approximation; (toX+xStep,toY+yStep) might be really correct.
    // Ignore this.
    if (state == 2) {
      return MathUtils.distance(toX + xstep, toY, fromX, fromY);
    }
    // else we didn't find even black-white-black; no estimate is really
    // possible
    return NaN;
  };


  /**
   * See {@link #sizeOfBlackWhiteBlackRun(int, int, int, int)}; computes
   * the total width of
   * a finder pattern by looking for a black-white-black run from the center
   * in the direction
   * of another point (another finder pattern center), and in the opposite
   * direction too.
   *
   * @param {number} fromX
   * @param {number} fromY
   * @param {number} toX
   * @param {number} toY
   * @return {number}
   */
  pro.sizeOfBlackWhiteBlackRunBothWays = function(fromX, fromY, toX, toY) {
    var result = this.sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);

    // Now count other way -- don't run off image though of course
    var scale = 1.0;
    var otherToX = fromX - (toX - fromX);
    if (otherToX < 0) {
      scale = fromX / (fromX - otherToX);
      otherToX = 0;
    } else if (otherToX >= this.image.getWidth()) {
      scale = (this.image.getWidth() - 1 - fromX) / (otherToX - fromX);
      otherToX = this.image.getWidth() - 1;
    }
    var otherToY = Math.floor(fromY - (toY - fromY) * scale);

    scale = 1.0;
    if (otherToY < 0) {
      scale = fromY / (fromY - otherToY);
      otherToY = 0;
    } else if (otherToY >= this.image.getHeight()) {
      scale = (this.image.getHeight() - 1 - fromY) / (otherToY - fromY);
      otherToY = this.image.getHeight() - 1;
    }
    otherToX = Math.floor(fromX + (otherToX - fromX) * scale);

    result += this.sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);
    return result - 1.0; // -1 because we counted the middle pixel twice
  };

  /**
   * Estimates module size based on two finder patterns -- it uses
   * {@link #sizeOfBlackWhiteBlackRunBothWays(int, int, int, int)} to
   * figure the
   * width of each, measuring along the axis between their centers.
   * @param {ResultPoint} pattern first pattern
   * @param {ResultPoint} otherPattern other pattern
   * @return {number} module size
   * @final
   */
  pro.calculateModuleSizeOneWay = function(pattern, otherPattern) {
    var moduleSizeEst1 = this.sizeOfBlackWhiteBlackRunBothWays(
      Math.floor(pattern.x),
      Math.floor(pattern.y), Math.floor(otherPattern.x),
      Math.floor(otherPattern.y));
    var moduleSizeEst2 = this.sizeOfBlackWhiteBlackRunBothWays(
      Math.floor(otherPattern.x),
      Math.floor(otherPattern.y), Math.floor(pattern.x),
      Math.floor(pattern.y));
    if (isNaN(moduleSizeEst1)) {
      return moduleSizeEst2 / 7.0;
    }
    if (isNaN(moduleSizeEst2)) {
      return moduleSizeEst1 / 7.0;
    }
    // Average them, and divide by 7 since we've counted the width of 3 black
    // modules, and 1 white and 1 black module on either side. Ergo, divide sum
    // by 14.
    return (moduleSizeEst1 + moduleSizeEst2) / 14.0;
  };

  /**
   * Computes an average estimated module size based on estimated derived from
   * the positions of the three finder patterns.
   *
   * @param {ResultPoint} topLeft detected top-left finder pattern center
   * @param {ResultPoint} topRight detected top-right finder pattern center
   * @param {ResultPoint} bottomLeft detected bottom-left finder pattern center
   * @return {number} estimated module size
   */
  pro.calculateModuleSize = function(topLeft, topRight, bottomLeft) {
    // Take the average
    return (this.calculateModuleSizeOneWay(topLeft,
      topRight) + this.calculateModuleSizeOneWay(topLeft, bottomLeft)) / 2.0;
  };

  /**
   * Computes the dimension (number of modules on a size) of the QR Code based
   * on the position of the finder patterns and estimated module size.
   *
   * @param {ResultPoint} topLeft detected top-left finder pattern center
   * @param {ResultPoint} topRight detected top-right finder pattern center
   * @param {ResultPoint} bottomLeft detected bottom-left finder pattern center
   * @param {number} moduleSize
   * @return {number} computed dimension
   */
  pro.computeDimension = function(topLeft, topRight, bottomLeft, moduleSize) {
    var tltrCentersDimension = ResultPoint.distance(topLeft,
      topRight) / moduleSize;
    var tlblCentersDimension = ResultPoint.distance(topLeft,
      bottomLeft) / moduleSize;
    var dimension = ((
      tltrCentersDimension + tlblCentersDimension) >> 1) + 7;
    switch (dimension % 4) {
      // mod 4
      case 0:
        dimension++;
        break;
      // 1? do nothing

      case 2:
        dimension--;
        break;

      case 3:
        // would it be better to do something like dimension += 2; ?
        // throw new NotFoundException();
        dimension += 2;
    }
    // Sometimes dimension is 17 - which is invalid. Why?
    return dimension;
  };

  /**
   * <p>Attempts to locate an alignment pattern in a limited region of the
   * image, which is
   * guessed to contain it. This method uses {@link AlignmentPattern}.</p>
   *
   * @param {number} overallEstModuleSize estimated module size so far.
   * @param {number} estAlignmentX x coordinate of center of area probably
   * containing alignment pattern.
   * @param {number} estAlignmentY y coordinate of above.
   * @param {number} allowanceFactor number of pixels in all directions to
   * search from the center.
   * @return {AlignmentPattern} if found, or null otherwise.
   * @throws {NotFoundException} if an unexpected error occurs during detection
   */
  pro.findAlignmentInRegion = function(overallEstModuleSize, estAlignmentX,
                                       estAlignmentY, allowanceFactor) {
    // Look for an alignment pattern (3 modules in size) around where it
    // should be
    var allowance = Math.floor(allowanceFactor * overallEstModuleSize);
    var alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
    var alignmentAreaRightX = Math.min(this.image.getWidth() - 1,
      estAlignmentX + allowance);
    if (alignmentAreaRightX - alignmentAreaLeftX <
      overallEstModuleSize * 3) {
      throw new NotFoundException();
    }

    var alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
    var alignmentAreaBottomY = Math.min(this.image.getHeight() - 1,
      estAlignmentY + allowance);

    var alignmentFinder = new w69b.qr.detector.AlignmentPatternFinder(this.image,
      alignmentAreaLeftX, alignmentAreaTopY,
      alignmentAreaRightX - alignmentAreaLeftX,
      alignmentAreaBottomY - alignmentAreaTopY, overallEstModuleSize,
      this.resultPointCallback);
    return alignmentFinder.find();
  };

  /**
   * @param {ResultPoint} topLeft detected top-left finder pattern center
   * @param {ResultPoint} topRight detected top-right finder pattern center
   * @param {ResultPoint} bottomLeft detected bottom-left finder pattern center
   * @param {ResultPoint} alignmentPattern
   * @param {number} dimension
   * @return {PerspectiveTransform}
   */
  pro.createTransform = function(topLeft, topRight, bottomLeft,
                                 alignmentPattern, dimension) {
    var dimMinusThree = dimension - 3.5;
    var bottomRightX;
    var bottomRightY;
    var sourceBottomRightX;
    var sourceBottomRightY;
    if (alignmentPattern != null) {
      bottomRightX = alignmentPattern.x;
      bottomRightY = alignmentPattern.y;
      sourceBottomRightX = sourceBottomRightY = dimMinusThree - 3.0;
    } else {
      // Don't have an alignment pattern, just make up the bottom-right point
      bottomRightX = (topRight.x - topLeft.x) + bottomLeft.x;
      bottomRightY = (topRight.y - topLeft.y) + bottomLeft.y;
      sourceBottomRightX = sourceBottomRightY = dimMinusThree;
    }

    var transform = PerspectiveTransform.quadrilateralToQuadrilateral(3.5,
      3.5,
      dimMinusThree, 3.5, sourceBottomRightX, sourceBottomRightY, 3.5,
      dimMinusThree, topLeft.x, topLeft.y, topRight.x, topRight.y,
      bottomRightX,
      bottomRightY, bottomLeft.x, bottomLeft.y);

    return transform;
  };

  /**
   * @param {BitMatrix} image
   * @param {PerspectiveTransform} transform
   * @param {number} dimension
   * @return {BitMatrix}
   */
  pro.sampleGrid = function(image, transform, dimension) {
    var sampler = GridSampler.getInstance();
    return sampler.sampleGridTransform(image, dimension, dimension, transform);
  };

  /**
   * TODO.
   * @param {w69b.qr.detector.FinderPatternInfo} info info.
   * @return {!w69b.common.DetectorResult} result.
   * @throws {NotFoundException}
   */
  pro.processFinderPatternInfo = function(info) {

    var topLeft = info.topLeft;
    var topRight = info.topRight;
    var bottomLeft = info.bottomLeft;

    var moduleSize = this.calculateModuleSize(topLeft, topRight, bottomLeft);
    if (moduleSize < 1.0) {
      throw new NotFoundException();
    }
    var dimension = this.computeDimension(topLeft, topRight, bottomLeft,
      moduleSize);
    var provisionalVersion = Version.getProvisionalVersionForDimension(
      dimension);
    var modulesBetweenFPCenters =
      provisionalVersion.getDimensionForVersion() - 7;

    var alignmentPattern = null;
    // Anything above version 1 has an alignment pattern
    if (provisionalVersion.alignmentPatternCenters.length > 0) {

      // Guess where a "bottom right" finder pattern would have been
      let bottomRightX = topRight.x - topLeft.x + bottomLeft.x;
      let bottomRightY = topRight.y - topLeft.y + bottomLeft.y;

      // Estimate that alignment pattern is closer by 3 modules
      // from "bottom right" to known top left location
      let correctionToTopLeft = 1.0 - 3.0 / modulesBetweenFPCenters;
      let estAlignmentX = Math.floor(topLeft.x +
        correctionToTopLeft * (bottomRightX - topLeft.x));
      let estAlignmentY = Math.floor(topLeft.y +
        correctionToTopLeft * (bottomRightY - topLeft.y));

      // Kind of arbitrary -- expand search radius before giving up
      for (let i = 4; i <= 16; i *= 2) {
        try {
          alignmentPattern =
            this.findAlignmentInRegion(moduleSize, estAlignmentX,
              estAlignmentY, i);
          break;
        }
        catch (err) {
          if (!(err instanceof NotFoundException))
            throw err;
          // try next round
        }
      }
      // If we didn't find alignment pattern... well try anyway without it
    }

    var transform = this.createTransform(topLeft, topRight, bottomLeft,
      alignmentPattern, dimension);

    var bits = this.sampleGrid(this.image, transform, dimension);

    var points;
    if (alignmentPattern == null) {
      points = [bottomLeft, topLeft, topRight];
    } else {
      points = [bottomLeft, topLeft, topRight, alignmentPattern];
    }
    return new DetectorResult(bits, points);
  };

  /**
   * Detects a QR Code in an image.
   *
   * @param {Object<DecodeHintType,*>=} opt_hints optional hints to detector
   * @return {DetectorResult} encapsulating results of detecting a QR Code
   * @throws {NotFoundException} if QR Code cannot be found
   * @throws {FormatException} if a QR Code cannot be decoded
   */
  pro.detect = function(opt_hints) {
    var callback = null;
    if (opt_hints && !!opt_hints[DecodeHintType.NEED_RESULT_POINT_CALLBACK]) {
      callback = /** @type {(w69b.ResultPointCallback|undefined)} */ (opt_hints[DecodeHintType.NEED_RESULT_POINT_CALLBACK]);
    }
    this.resultPointCallback = callback;

    var finder = new w69b.qr.detector.FinderPatternFinder(this.image, callback ? callback : undefined);
    var info = finder.find(opt_hints);
    return this.processFinderPatternInfo(info);
  };
});
