// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.worker.DecodeWorker');
goog.require('w69b.BinaryBitmap');
goog.require('w69b.DecodeHintType');
goog.require('w69b.ImageDataLuminanceSource');
goog.require('w69b.InvalidCharsetException');
goog.require('w69b.MultiFormatReader');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.HybridBinarizer');
goog.require('w69b.common.NoOpBinarizer');
goog.require('w69b.worker.WorkerMessageType');


// Hack to work arround closure warnings.
var host = self;

goog.scope(function() {
  var WorkerMessageType = w69b.worker.WorkerMessageType;
  var DecodeHintType = w69b.DecodeHintType;
  var ResultPoint = w69b.ResultPoint;

  var _ = w69b.worker.DecodeWorker;
  _.iconvPath = 'iconv.js';

  /**
   * @param {string} msgType messsage type.
   * @param {*=} opt_result value.
   */
  _.send = function(msgType, opt_result) {
    host.postMessage([msgType, host['JSON'].stringify(opt_result)]);
  };

  /**
   * @param {!ImageData} imgdata image to
   * @param {boolean} isBinary
   * @param {Array=} opt_formats
   * @param {boolean=} opt_failOnCharset immediately fail on charset error if
   *                                     true, do not try to load iconv. decode.
   */
  _.decode = function(imgdata, isBinary, opt_formats, opt_failOnCharset) {
    var result;
    try {
      result = _.decodeFromImageData(imgdata, isBinary, opt_formats, _.onPatternFound);
    } catch (err) {
      if (err instanceof w69b.InvalidCharsetException && !self.iconv &&
        _.iconvPath && !opt_failOnCharset) {
        // load iconv.
        importScripts(_.iconvPath);
        // and try again.
        _.decode(imgdata, true);
        return;
      } else if (err instanceof w69b.NotFoundException) {
        _.send(WorkerMessageType.NOTFOUND, err && err.message);
        return;
      } else {
        throw err;
      }
    }
    _.send(WorkerMessageType.DECODED, result);
  };

  /**
   * Decode barcode from ImageData.
   * @param {!ImageData} imgdata from canvas.
   * @param {boolean} isBinary
   * @param {Array=} opt_formats
   * @param {?w69b.ResultPointCallback=} opt_callback callback.
   * @return {w69b.Result} decoded barcode.
   * @throws {w69b.NotFoundException} if nothing found
   */
  _.decodeFromImageData = function(imgdata, isBinary, opt_formats, opt_callback) {
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

  /**
   * @param {ResultPoint} pattern found.
   */
  _.onPatternFound = function(pattern) {
    // Build plain json object.
    _.send(WorkerMessageType.PATTERN, pattern);
  };

  /**
   * Received message from host.
   * @param {MessageEvent} event
   */
  self.onmessage = function(event) {
    var data = event.data;
    // Message only sent for feature detection of transferable objects.
    if (data['isfeaturedetect']) {
      // do nothing.
    } else if (data['setIconvUrl']) {
      _.iconvPath = data['setIconvUrl'];
    } else {
      // decode
      var width = data['width'];
      var height = data['height'];
      var buffer = data['buffer'];
      var formats = data['formats'];
      var isFirefox = data['isFirefox'];
      var isBinary = data['isBinary'] || false;
      var isGrayscale = data['isGrayscale'];
      if (!buffer.byteLength) {
        throw Error('worker commmunication failed');
      }
      var imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
      imageData.grayscale_ = isGrayscale;
      _.decode(imageData, isBinary, formats);
      // Hack for FF memory leak - if webgl is used, we tranfer back the
      // buffer as a workaround.
      if (isFirefox) {
        host.postMessage(['ffmemoryhack', null], [buffer]);
        event.data['buffer'] = null;
        // event.data = null;
      }
    }
  };
});
