// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
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
goog.provide('w69b.qr.detector.FinderPatternInfo');
goog.require('w69b.qr.detector.FinderPattern');

goog.scope(function() {
  /**
   * Encapsulates information about finder patterns in an image, including the location of
   * the three finder patterns, and their estimated module size.
   * @constructor
   * @param {Array.<w69b.qr.detector.FinderPattern>} patternCenters size 3 array with
   * bottom left, top left and top right corner.
   */
  w69b.qr.detector.FinderPatternInfo = function(patternCenters) {
    // Bottom left and top right is flipped. Why?
    this.bottomLeft = patternCenters[0];
    this.topLeft = patternCenters[1];
    this.topRight = patternCenters[2];
  };
  var FinderPatternInfo = w69b.qr.detector.FinderPatternInfo;
  var pro = FinderPatternInfo.prototype;

  /**
   * @return {w69b.qr.detector.FinderPattern} bottomLeft pattern
   */
  pro.getBottomLeft = function() {
    return this.bottomLeft;
  };

  /**
   * @return {w69b.qr.detector.FinderPattern} topLeft pattern
   */
  pro.getTopLeft = function() {
    return this.topLeft;
  };

  /**
   * @return {w69b.qr.detector.FinderPattern} topRight pattern
   */
  pro.getTopRight = function() {
    return this.topRight;
  };
});
