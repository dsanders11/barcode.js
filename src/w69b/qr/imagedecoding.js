// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.qr.imagedecoding');
goog.require('w69b.BinaryBitmap');
goog.require('w69b.DecodeHintType');
goog.require('w69b.ImageDataLuminanceSource');
goog.require('w69b.MultiFormatReader');
goog.require('w69b.ReaderException');
goog.require('w69b.common.HybridBinarizer');
goog.require('w69b.common.NoOpBinarizer');
goog.require('w69b.img.WebGLBinarizer');
goog.require('w69b.qr.DecodeResult');
goog.require('w69b.qr.decoder.Decoder');


/**
 * Simple high-level interface to decode qr codes.
 * @author mb@w69b.com (Manuel Braun)
 */
goog.scope(function() {
  var DecodeHintType = w69b.DecodeHintType;
  var DecodeResult = w69b.qr.DecodeResult;
  var WebGLBinarizer = w69b.img.WebGLBinarizer;
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
   * @param {?w69b.qr.ResultPointCallback=} opt_callback callback.
   * @return {DecodeResult} decoded qr code.
   */
  _.decodeFromImageData = function(imgdata, isBinary, opt_callback) {
    var result;
    try {
      result = _.decodeFromImageDataThrowing(imgdata, isBinary, opt_callback);
    } catch (err) {
      result = new DecodeResult(err);
      if (!(err instanceof w69b.ReaderException))
        throw err;
    }
    return result;
  };

  /**
   * Throws ReaderException if detection fails.
   * @param {!ImageData} imgdata from canvas.
   * @param {boolean} isBinary
   * @param {?w69b.qr.ResultPointCallback=} opt_callback callback.
   * @return {DecodeResult} decoded qr code.
   */
  _.decodeFromImageDataThrowing = function(imgdata, isBinary, opt_callback) {
    var luminanceSource = new w69b.ImageDataLuminanceSource(imgdata);
    var binarizer;
    if (isBinary) {
      binarizer = new w69b.common.NoOpBinarizer(luminanceSource);
    } else {
      binarizer = new w69b.common.HybridBinarizer(luminanceSource);
    }
    var bitmap = new w69b.BinaryBitmap(binarizer);
    var opt_hints = undefined;

    if (opt_callback) {
      opt_hints = {};
      opt_hints[DecodeHintType.NEED_RESULT_POINT_CALLBACK] = opt_callback;
    }

    var result = new w69b.MultiFormatReader().decode(bitmap);

    return new DecodeResult(result.getText(), result.getResultPoints());
  };

});

goog.exportSymbol('w69b.qr.imagedecoding.decodeFromImageData',
  w69b.qr.imagedecoding.decodeFromImageData);
