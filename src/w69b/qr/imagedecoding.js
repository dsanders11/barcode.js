// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.qr.imagedecoding');
goog.require('w69b.BinaryBitmap');
goog.require('w69b.DecodeHintType');
goog.require('w69b.ImageDataLuminanceSource');
goog.require('w69b.MultiFormatReader');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.common.HybridBinarizer');
goog.require('w69b.common.NoOpBinarizer');
goog.require('w69b.qr.decoder.Decoder');
goog.require('w69b.webgl.WebGLBinarizer');


/**
 * Simple high-level interface to decode qr codes.
 * @author mb@w69b.com (Manuel Braun)
 */
goog.scope(function() {
  var DecodeHintType = w69b.DecodeHintType;
  var WebGLBinarizer = w69b.webgl.WebGLBinarizer;
  //var imgtools = w69b.imgtools;

  var _ = w69b.qr.imagedecoding;

  _.decoder_ = new w69b.qr.decoder.Decoder();

  _.webGLBinarizer_ = null;

  /**
   * @return {WebGLBinarizer}
   */
  _.getWebGLBinarizer_ = function() {
    if (!_.webGLBinarizer_) {
      _.webGLBinarizer_ = new WebGLBinarizer();
    }
    return _.webGLBinarizer_;
  };

  /**
   * Decode qr code from ImageData.
   * @param {!ImageData} imgdata from canvas.
   * @param {boolean} isBinary
   * @param {Array=} opt_formats
   * @param {?w69b.ResultPointCallback=} opt_callback callback.
   * @return {w69b.Result} decoded qr code.
   * @throws {w69b.NotFoundException} if nothing found
   */
  _.decodeFromImageDataThrowing = function(imgdata, isBinary, opt_formats, opt_callback) {
    var luminanceSource = new w69b.ImageDataLuminanceSource(imgdata);
    var binarizer;
    if (isBinary) {
      binarizer = new w69b.common.NoOpBinarizer(luminanceSource);
    } else {
      binarizer = new w69b.common.HybridBinarizer(luminanceSource);
    }
    var bitmap = new w69b.BinaryBitmap(binarizer);
    var opt_hints = (opt_formats || opt_callback) ? {} : undefined;

    if (opt_callback) {
      opt_hints[DecodeHintType.NEED_RESULT_POINT_CALLBACK] = opt_callback;
    }

    if (opt_formats) {
      opt_hints[DecodeHintType.POSSIBLE_FORMATS] = opt_formats;
    }

    return new w69b.MultiFormatReader().decode(bitmap, opt_hints);
  };
});
