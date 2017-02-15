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

goog.provide('w69b.ReaderException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * The general exception class throw when something goes wrong during
   * decoding of a barcode. This includes, but is not limited to, failing
   * checksums / error correction algorithms, being unable to locate finder
   * timing patterns, and so on.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  w69b.ReaderException = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(w69b.ReaderException, goog.debug.Error);
});
