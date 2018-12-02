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

goog.provide('w69b.ChecksumException');
goog.require('w69b.ReaderException');

goog.scope(function() {
  /**
   * Thrown when a barcode was successfully detected and decoded, but
   * was not returned because its checksum feature failed.
   * @constructor
   * @extends {w69b.ReaderException}
   */
  w69b.ChecksumException = function() {
    w69b.ChecksumException.base(this, 'constructor');
  };
  goog.inherits(w69b.ChecksumException, w69b.ReaderException);

  const _ = w69b.ChecksumException;

  /**
   * @type {!w69b.ChecksumException}
   */
  const INSTANCE = new w69b.ChecksumException();

  /**
   * @returns {!w69b.ChecksumException}
   */
  _.getChecksumInstance = function() {
    return INSTANCE;
  };
});
