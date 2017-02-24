// (c) 2017 David Sanders (dsanders11@ucsbalum.com)

define(['chai', '../common/bitmatrix.spec.js'], function(chai, BitMatrixTestCase) {
  var assert = chai.assert;
  var BarcodeFormat = w69b.BarcodeFormat;
  var ITFWriter = w69b.oned.ITFWriter;

  describe('ITFWriter', function() {
    it('testEncode', function() {
      var input = "00123456789012";
      var expected = "000001010101011100011100010111010001010111000111011101" +
        "0001010001110100011100010101000101011100011101011101000111000101110" +
        "100010101110001110100000";

      var result = new ITFWriter().encode(input, BarcodeFormat.ITF, 0, 0);
      assert.equal(expected, BitMatrixTestCase.matrixToString(result));
    });
  });
});
