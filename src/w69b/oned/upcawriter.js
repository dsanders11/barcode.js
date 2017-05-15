// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2010 ZXing authors
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

goog.provide('w69b.oned.UPCAWriter');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.Writer');
goog.require('w69b.oned.EAN13Writer');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const BarcodeFormat = w69b.BarcodeFormat;
  const Writer = w69b.Writer;
  const EAN13Writer = w69b.oned.EAN13Writer;

  /**
   * This object renders a UPC-A code as a {@link BitMatrix}.
   * @constructor
   * @implements {Writer}
   * @final
   */
  w69b.oned.UPCAWriter = function() {
    this.subWriter_ = new EAN13Writer();
  };
  const UPCAWriter = w69b.oned.UPCAWriter;
  const pro = UPCAWriter.prototype;

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format !== BarcodeFormat.UPC_A) {
      throw new IllegalArgumentException("Can only encode UPC-A, but got " + format);
    }
    // Transform a UPC-A code into the equivalent EAN-13 code and write it that way
    return this.subWriter_.encode('0' + contents, BarcodeFormat.EAN_13, width, height, opt_hints);
  };
});
