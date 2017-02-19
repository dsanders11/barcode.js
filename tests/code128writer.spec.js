// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2014 ZXing authors
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


define(['chai', './bitmatrix.spec.js'], function(chai, BitMatrixTestCase) {
  var assert = chai.assert;
  var BarcodeFormat = w69b.BarcodeFormat;
  var Code128Reader = w69b.oned.Code128Reader;
  var Code128Writer = w69b.oned.Code128Writer;

  var FNC1 = "11110101110";
  var FNC2 = "11110101000";
  var FNC3 = "10111100010";
  var FNC4 = "10111101110";
  var START_CODE_B = "11010010000";
  var START_CODE_C = "11010011100";
  var SWITCH_CODE_B = "10111101110";
  var QUIET_SPACE = "00000";
  var STOP = "1100011101011";

  var writer = null;
  var reader = null;

  describe('Code128Writer', function() {
    beforeEach(function() {
      writer = new Code128Writer();
      reader = new Code128Reader();
    });

    it('testEncodeWithFunc3', function() {
      var toEncode = "\u00f3" + "123";
      //                                                       "1"            "2"             "3"          check digit 51
      var expected = QUIET_SPACE + START_CODE_B + FNC3 + "10011100110" + "11001110010" + "11001011100" + "11101000110" + STOP + QUIET_SPACE;

      var result = writer.encode(toEncode, BarcodeFormat.CODE_128, 0, 0);

      var actual = BitMatrixTestCase.matrixToString(result);
      assert.equal(expected, actual);
    });

    it('testEncodeWithFunc2', function() {
      var toEncode = "\u00f2" + "123";
      //                                                       "1"            "2"             "3"          check digit 56
      var expected = QUIET_SPACE + START_CODE_B + FNC2 + "10011100110" + "11001110010" + "11001011100" + "11100010110" + STOP + QUIET_SPACE;

      var result = writer.encode(toEncode, BarcodeFormat.CODE_128, 0, 0);

      var actual = BitMatrixTestCase.matrixToString(result);
      assert.equal(expected, actual);
    });

    it('testEncodeWithFunc1', function() {
      var toEncode = "\u00f1" + "123";
      //                                                       "1"            "2"             "3"          check digit 92
      var expected = QUIET_SPACE + START_CODE_C + FNC1 + "10110011100" + SWITCH_CODE_B + "11001011100" + "10101111000" + STOP + QUIET_SPACE;

      var result = writer.encode(toEncode, BarcodeFormat.CODE_128, 0, 0);

      var actual = BitMatrixTestCase.matrixToString(result);
      assert.equal(expected, actual);
    });

    it('testRoundtrip', function() {
      var toEncode = "\u00f1" + "10958" + "\u00f1" + "17160526";
      var expected = "1095817160526";

      var encResult = writer.encode(toEncode, BarcodeFormat.CODE_128, 0, 0);
      var row = encResult.getRow(0, null);
      var rtResult = reader.decodeRow(0, row, null);
      var actual = rtResult.getText();
      assert.equal(expected, actual);
    });

    it('testEncodeWithFunc4', function() {
      var toEncode = "\u00f4" + "123";
      //                                                       "1"            "2"             "3"          check digit 59
      var expected = QUIET_SPACE + START_CODE_B + FNC4 + "10011100110" + "11001110010" + "11001011100" + "11100011010" + STOP + QUIET_SPACE;

      var result = writer.encode(toEncode, BarcodeFormat.CODE_128, 0, 0);

      var actual = BitMatrixTestCase.matrixToString(result);
      assert.equal(expected, actual);
    });
  });
});
