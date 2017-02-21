// (c) 2013 Manuel Braun (mb@w69b.com)

goog.provide('w69b.qr.nativepreprocessing');
goog.require('w69b.ImageDataLuminanceSource');
goog.require('w69b.common.HybridBinarizer');

goog.scope(function() {
  var _ = w69b.qr.nativepreprocessing;
  var ImageDataLuminanceSource = w69b.ImageDataLuminanceSource;

  /**
   * @param {ImageData} imageData data from canvas.
   * @return {!w69b.common.BitMatrix} binary data.
   */
  _.binarizeImageData = function(imageData) {
    var luminanceSource = new ImageDataLuminanceSource(imageData);
    var binarizer = new w69b.common.HybridBinarizer(luminanceSource);
    return binarizer.getBlackMatrix();
  };
});
