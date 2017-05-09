// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2011 ZXing authors
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
  var CodaBarWriter = w69b.oned.CodaBarWriter;

  describe('CodaBarWriter', function() {
    it('testEncode', function() {
      doTest("B515-3/B",
             "00000" +
             "1001001011" + "0110101001" + "0101011001" + "0110101001" + "0101001101" +
             "0110010101" + "01101101011" + "01001001011" +
             "00000");
    });

    it('testEncode2', function() {
      doTest("T123T",
             "00000" +
             "1011001001" + "0101011001" + "0101001011" + "0110010101" + "01011001001" +
             "00000");
    });

    it('testAltStartEnd', function() {
      assert.deepEqual(encode("T123456789-$T"), encode("A123456789-$A"));
    });

    function doTest(input, expected)  {
      var result = encode(input);
      assert.equal(expected, BitMatrixTestCase.matrixToString(result));
    }

    function encode(input) {
      return new CodaBarWriter().encode(input, BarcodeFormat.CODABAR, 0, 0);
    }
  });
});
