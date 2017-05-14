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

goog.provide('w69b.oned.UPCAReader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.FormatException');
goog.require('w69b.Result');
goog.require('w69b.oned.EAN13Reader');
goog.require('w69b.oned.UPCEANReader');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const FormatException = w69b.FormatException;
  const Result = w69b.Result;
  const EAN13Reader = w69b.oned.EAN13Reader;
  const UPCEANReader = w69b.oned.UPCEANReader;


  /**
   * Implements decoding of the UPC-A format
   * @constructor
   * @extends {UPCEANReader}
   * @final
   */
  w69b.oned.UPCAReader = function() {
    goog.base(this);
    this.ean13Reader_ = new EAN13Reader();
  };
  const UPCAReader = w69b.oned.UPCAReader;
  goog.inherits(UPCAReader, UPCEANReader);
  const pro = UPCAReader.prototype;

  /**
   * @override
   */
  pro.decodeRow2 = function(rowNumber, row, startGuardRange, hints) {
    return maybeReturnResult(this.ean13Reader_.decodeRow2(rowNumber, row, startGuardRange, hints));
  };

  /**
   * @override
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    return maybeReturnResult(this.ean13Reader_.decodeRow(rowNumber, row, hints));
  };

  /**
   * @override
   */
  pro.decode = function(image, opt_hints) {
    return maybeReturnResult(this.ean13Reader_.decode(image, opt_hints));
  };

  /**
   * @override
   */
  pro.getBarcodeFormat = function() {
    return BarcodeFormat.UPC_A;
  };

  /**
   * @override
   */
  pro.decodeMiddle = function(row, startRange, resultString) {
    return this.ean13Reader_.decodeMiddle(row, startRange, resultString);
  };

  /**
   * @param {!Result} result
   * @return {!Result}
   * @throws {FormatException}
   */
  function maybeReturnResult(result) {
    var text = result.getText();
    if (text.charAt(0) === '0') {
      return new Result(text.substring(1), null, result.getResultPoints(), BarcodeFormat.UPC_A);
    } else {
      throw new FormatException();
    }
  }
});
