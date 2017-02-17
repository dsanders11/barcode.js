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
goog.provide('w69b.qr.detector.FinderPattern');
goog.require('w69b.ResultPoint');

goog.scope(function() {
  /**
   * @param {number} posX x pos.
   * @param {number} posY y pos.
   * @param {number} estimatedModuleSize estimated size.
   * @param {number=} opt_count count, defaults to 1.
   * @extends {w69b.ResultPoint}
   * @constructor
   */
  w69b.qr.detector.FinderPattern = function(posX, posY, estimatedModuleSize,
                                   opt_count) {
    goog.base(this, posX, posY);
    this.count = goog.isDef(opt_count) ? opt_count : 1;
    this.estimatedModuleSize = estimatedModuleSize;
  };
  var FinderPattern = w69b.qr.detector.FinderPattern;
  goog.inherits(FinderPattern, w69b.ResultPoint);
  var pro = FinderPattern.prototype;

  /**
   * @return {number}
   */
  pro.getCount = function() {
    return this.count;
  };

  /**
   * Determines if this finder pattern "about equals" a finder pattern at the stated
   * position and size -- meaning, it is at nearly the same center with nearly the same size.
   * @param {number} moduleSize
   * @param {number} i
   * @param {number} j
   * @return {boolean}
   */
  pro.aboutEquals = function(moduleSize, i, j) {
    if (Math.abs(i - this.y) <= moduleSize &&
      Math.abs(j - this.x) <= moduleSize) {
      var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
      return moduleSizeDiff <= 1.0 ||
        moduleSizeDiff <= this.estimatedModuleSize;
    }
    return false;
  };

  /**
   * Combines this object's current estimate of a finder pattern position and
   * module size
   * with a new estimate. It returns a new {@code FinderPattern} containing
   * a weighted average based on count.
   * @param {number} i position.
   * @param {number} j position.
   * @param {number} newModuleSize size.
   * @return {FinderPattern} combined pattern.
   */
  pro.combineEstimate = function(i, j, newModuleSize) {
    var count = this.count;
    var combinedCount = count + 1;
    var combinedX = (count * this.x + j) / combinedCount;
    var combinedY = (count * this.y + i) / combinedCount;
    var combinedModuleSize = (count * this.estimatedModuleSize +
      newModuleSize) / combinedCount;
    return new FinderPattern(combinedX, combinedY,
      combinedModuleSize, combinedCount);
  };

  /**
   * @return {number} module size.
   */
  pro.getEstimatedModuleSize = function() {
    return this.estimatedModuleSize;
  };

  /**
   * @return {number} x pos.
   */
  pro.getX = function() {
    return this.x;
  };

  /**
   * @return {number} y pos.
   */
  pro.getY = function() {
    return this.y;
  };

  /**
   * @return {Object} JSON object for pattern.
   */
  pro['toJSON'] = function() {
    return {
      'x': this.getX(),
      'y': this.getY(),
      'size': this.getEstimatedModuleSize()};
  };
});
