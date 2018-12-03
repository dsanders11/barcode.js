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

goog.module('w69b.common.reedsolomon.ReedSolomonException');
goog.module.declareLegacyNamespace();

const ReaderException = goog.require('w69b.ReaderException');

/**
 * Thrown when an exception occurs during Reed-Solomon decoding, such as when
 * there are too many errors to correct.
 */
class ReedSolomonException extends ReaderException {
  /**
   * @param {string=} opt_msg message.
   */
  constructor(opt_msg) {
    super(opt_msg);
  }
}

exports = ReedSolomonException;
