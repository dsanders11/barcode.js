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
  var EAN8Writer = w69b.oned.EAN8Writer;

  describe('EAN8Writer', function() {
    it('testEncode', function() {
      var testStr = "0000001010001011010111101111010110111010101001110111001010001001011100101000000";
      var result = new EAN8Writer().encode("96385074", BarcodeFormat.EAN_8, testStr.length, 0);
      assert.equal(testStr, BitMatrixTestCase.matrixToString(result));
    });

    it('testAddChecksumAndEncode', function() {
      var testStr = "0000001010001011010111101111010110111010101001110111001010001001011100101000000";
      var result = new EAN8Writer().encode("9638507", BarcodeFormat.EAN_8, testStr.length, 0);
      assert.equal(testStr, BitMatrixTestCase.matrixToString(result));
    });
  });
});