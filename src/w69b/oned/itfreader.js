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

goog.provide('w69b.oned.ITFReader');
goog.require('w69b.oned.OneDReader');


goog.scope(function() {
  var OneDReader = w69b.oned.OneDReader;

  // TODO

  /**
   * @constructor
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.ITFReader = function() { };
  var ITFReader = w69b.oned.ITFReader;
  goog.inherits(ITFReader, OneDReader);
  var pro = ITFReader.prototype;

  /**
   * Pixel width of a wide line
   * @final
   * @private
   */
  var W = 3;

  /**
   * Pixed width of a narrow line
   * @final
   * @private
   */
  var N = 1;

  /**
   * Patterns of Wide / Narrow lines to indicate each digit
   * @type {!Array.<Array.<number>>}
   * @final
   */
  ITFReader.PATTERNS = [
      [N, N, W, W, N], // 0
      [W, N, N, N, W], // 1
      [N, W, N, N, W], // 2
      [W, W, N, N, N], // 3
      [N, N, W, N, W], // 4
      [W, N, W, N, N], // 5
      [N, W, W, N, N], // 6
      [N, N, N, W, W], // 7
      [W, N, N, W, N], // 8
      [N, W, N, W, N]  // 9
  ];
});
