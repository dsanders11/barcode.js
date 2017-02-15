// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
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

goog.provide('w69b.common.reedsolomon.ReedSolomonException');
goog.require('w69b.ReaderException');

goog.scope(function() {
  /**
   * Thrown when an exception occurs during Reed-Solomon decoding, such as when
   * there are too many errors to correct.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {w69b.ReaderException}
   */
  w69b.common.reedsolomon.ReedSolomonException = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(w69b.common.reedsolomon.ReedSolomonException, w69b.ReaderException);
});
