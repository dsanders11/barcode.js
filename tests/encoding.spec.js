// (c) 2013 Manuel Braun (mb@w69b.com)

define(['chai', 'sinon'], function(chai, sinon) {
  var expect = chai.expect;
  var BarcodeFormat = w69b.BarcodeFormat;
  describe('encoding API', function() {
    var encoding = w69b.encoding;
    it('should cache results', function() {
      var spy = sinon.spy(w69b.qr.encoder.Encoder, 'encode');
      encoding.drawAsSVG('hihi', BarcodeFormat.QR_CODE, 400, 400, 200);
      encoding.drawAsSVG('hihi', BarcodeFormat.QR_CODE, 400, 400, 200);
      expect(spy.callCount).equals(2);
      w69b.encoding.drawAsSVG('other', BarcodeFormat.QR_CODE, 400, 400, 200);
      expect(spy.callCount).equals(3);
      //encoding.drawAsSVG('other', BarcodeFormat.QR_CODE, 200, 0, 'H');
      //expect(spy.callCount).equals(3);
      spy.restore();
    });
  });
});

