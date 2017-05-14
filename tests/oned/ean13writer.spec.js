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


define(['chai', '../common/bitmatrix.spec.js'], function(chai, BitMatrixTestCase) {
  var assert = chai.assert;
  var BarcodeFormat = w69b.BarcodeFormat;
  var EAN13Writer = w69b.oned.EAN13Writer;

  describe('EAN13Writer', function() {
    it('testEncode', function() {
      var testStr = "00001010001011010011101100110010011011110100111010101011001101101100100001010111001001110100010010100000";
      var result = new EAN13Writer().encode("5901234123457", BarcodeFormat.EAN_13, testStr.length, 0);
      assert.equal(testStr, BitMatrixTestCase.matrixToString(result));
    });

    it('testAddChecksumAndEncode', function() {
      var testStr = "00001010001011010011101100110010011011110100111010101011001101101100100001010111001001110100010010100000";
      var result = new EAN13Writer().encode("590123412345", BarcodeFormat.EAN_13, testStr.length, 0);
      assert.equal(testStr, BitMatrixTestCase.matrixToString(result));
    });
  });
});
