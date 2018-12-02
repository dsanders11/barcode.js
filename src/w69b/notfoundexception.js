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

goog.provide('w69b.NotFoundException');
goog.require('w69b.ReaderException');

goog.scope(function() {
  /**
   * Thrown when a barcode was not found in the image. It might have been
   * partially detected but could not be confirmed.
   * @constructor
   * @extends {w69b.ReaderException}
   */
  w69b.NotFoundException = function() {
    w69b.NotFoundException.base(this, 'constructor');
  };
  goog.inherits(w69b.NotFoundException, w69b.ReaderException);

  const _ = w69b.NotFoundException;

  /**
   * @type {!w69b.NotFoundException}
   */
  const INSTANCE = new w69b.NotFoundException();

  /**
   * @returns {!w69b.NotFoundException}
   */
  _.getNotFoundInstance = function() {
    return INSTANCE;
  };
});
