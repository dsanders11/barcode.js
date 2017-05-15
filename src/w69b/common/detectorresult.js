// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
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
goog.provide('w69b.common.DetectorResult');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitMatrix');

goog.scope(function() {
  /**
   * @constructor
   * @param {!w69b.common.BitMatrix} bits raw barcode bits
   * @param {!Array.<!w69b.ResultPoint>} points points of interest
   */
  w69b.common.DetectorResult = function(bits, points) {
    this.bits = bits;
    this.points = points;
  };
  const DetectorResult = w69b.common.DetectorResult;
  const pro = DetectorResult.prototype;

  /**
   * @return {!w69b.common.BitMatrix} raw barcode bits
   */
  pro.getBits = function() {
    return this.bits;
  };

  /**
   * @return {!Array.<!w69b.ResultPoint>} points of interest
   */
  pro.getPoints = function() {
    return this.points;
  };
});
