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

goog.provide('w69b.MultiFormatReader');
goog.require('w69b.Reader');

goog.scope(function() {
  /**
   * MultiFormatReader is a convenience class and the main entry point into the
   * library for most uses. By default it attempts to decode all barcode
   * formats that the library supports. Optionally, you can provide a hints
   * object to request different behavior, for example only decoding QR codes.
   * @constructor
   * @implements {w69b.Reader}
   */
  w69b.MultiFormatReader = function() {

  };
  var pro = w69b.MultiFormatReader.prototype;

  /**
   * @override
   */
  pro.decode = function(image, opt_hints) {

  };

  /**
   * @throws {NotFoundException}
   */
  pro.decodeWithState = function(image) {

  };

  /**
   * @param {Object} hints Hints to do shit
   */
  pro.setHints = function(hints) {

  };

  /**
   * @override
   */
  pro.reset = function() {

  };

  /**
   * @private
   * @throws {NotFoundException}
   */
  function decodeInternal(image) {

  }
});
