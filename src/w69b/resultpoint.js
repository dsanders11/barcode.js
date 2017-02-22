// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
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
goog.provide('w69b.ResultPoint');
goog.require('w69b.common.detector.MathUtils');

goog.scope(function() {
  var MathUtils = w69b.common.detector.MathUtils;

  /**
   * @constructor
   * @param {number} posX x pos.
   * @param {number} posY y pos.
   */
  w69b.ResultPoint = function(posX, posY) {
    this.x = posX;
    this.y = posY;
  };
  var ResultPoint = w69b.ResultPoint;
  var pro = ResultPoint.prototype;

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
   * Orders an array of three ResultPoints in an order [A,B,C] such that AB is less than AC
   * and BC is less than AC, and the angle between BC and BA is less than 180 degrees.
   *
   * @param {Array.<ResultPoint>} patterns array of three {@code ResultPoint} to order
   */
  ResultPoint.orderBestPatterns = function(patterns) {
    // Find distances between pattern centers
    var zeroOneDistance = ResultPoint.distance(patterns[0], patterns[1]);
    var oneTwoDistance = ResultPoint.distance(patterns[1], patterns[2]);
    var zeroTwoDistance = ResultPoint.distance(patterns[0], patterns[2]);

    var pointA;
    var pointB;
    var pointC;
    // Assume one closest to other two is B; A and C will just be guesses at first
    if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance) {
      pointB = patterns[0];
      pointA = patterns[1];
      pointC = patterns[2];
    } else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance) {
      pointB = patterns[1];
      pointA = patterns[0];
      pointC = patterns[2];
    } else {
      pointB = patterns[2];
      pointA = patterns[0];
      pointC = patterns[1];
    }

    // Use cross product to figure out whether A and C are correct or flipped.
    // This asks whether BC x BA has a positive z component, which is the arrangement
    // we want for A, B, C. If it's negative, then we've got it flipped around and
    // should swap A and C.
    if (ResultPoint.crossProductZ(pointA, pointB, pointC) < 0.0) {
      var temp = pointA;
      pointA = pointC;
      pointC = temp;
    }

    patterns[0] = pointA;
    patterns[1] = pointB;
    patterns[2] = pointC;
  };

  /**
   * @param {ResultPoint} pattern1 first pattern
   * @param {ResultPoint} pattern2 second pattern
   * @return {number} distance between two points
   */
  ResultPoint.distance = function(pattern1, pattern2) {
    return MathUtils.distance(pattern1.x, pattern1.y, pattern2.x, pattern2.y);
  };

  /**
   * Returns the z component of the cross product between vectors BC and BA.
   * @param {ResultPoint} pointA
   * @param {ResultPoint} pointB
   * @param {ResultPoint} pointC
   * @return {number}
   */
  ResultPoint.crossProductZ = function(pointA, pointB, pointC) {
    var bX = pointB.x;
    var bY = pointB.y;
    return ((pointC.x - bX) * (pointA.y - bY)) - ((pointC.y - bY) * (pointA.x - bX));
  };

  /** @typedef {function(ResultPoint)} */
  w69b.ResultPointCallback;
});
