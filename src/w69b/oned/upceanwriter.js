// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2009 ZXing authors
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

goog.provide('w69b.oned.UPCEANWriter');
goog.require('w69b.oned.OneDimensionalCodeWriter');


goog.scope(function() {
  var OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;

  /**
   * Encapsulates functionality and implementation that is common to UPC and EAN families
   * of one-dimensional barcodes.
   * @constructor
   * @extends {OneDimensionalCodeWriter}
   * @abstract
   */
  w69b.oned.UPCEANWriter = function() { };
  var UPCEANWriter = w69b.oned.UPCEANWriter;
  goog.inherits(UPCEANWriter, OneDimensionalCodeWriter);
  var pro = UPCEANWriter.prototype;

  /**
   * @override
   */
  pro.getDefaultMargin = function() {
    // Use a different default more appropriate for UPC/EAN
    return 9;
  };
});
