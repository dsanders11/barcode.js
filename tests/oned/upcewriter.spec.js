// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2016 ZXing authors
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
  var UPCEWriter = w69b.oned.UPCEWriter;

  describe('UPCEWriter', function() {
    it('testEncode', function() {
      doTest("05096893",
             "0000000000010101110010100111000101101011110110111001011101010100000000000");
    });

    it('testEncodeSystem1', function() {
      doTest("12345670",
             "0000000000010100100110111101010001101110010000101001000101010100000000000");
    });

    it('testAddChecksumAndEncode', function() {
     doTest("0509689",
            "0000000000010101110010100111000101101011110110111001011101010100000000000");
    });

    function doTest(content, encoding) {
      var result = new UPCEWriter().encode(content, BarcodeFormat.UPC_E, encoding.length, 0);
      assert.equal(encoding, BitMatrixTestCase.matrixToString(result));
    }
  });
});
