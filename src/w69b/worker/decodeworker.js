// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.worker.DecodeWorker');
goog.require('w69b.BarcodeFormat');
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
const host = self;

goog.scope(function() {
  const WorkerMessageType = w69b.worker.WorkerMessageType;
  const DecodeHintType = w69b.DecodeHintType;
  const ResultPoint = w69b.ResultPoint;

  const _ = w69b.worker.DecodeWorker;
  _.iconvPath = 'iconv.js';

  let multiFormatReader = null;
  let grayscaleArray = null;

  /**
   * @param {string} msgType messsage type.
   * @param {*} result value.
   * @param {boolean=} returnBuffer
   */
  _.send = function(msgType, result, returnBuffer = false) {
    // As a work around to a memory leak in Firefox and Chrome, always transfer
    // the buffer back to the main thread once we are done using it
    const buffer = _.buffer_;
    host.postMessage([msgType, host['JSON'].stringify(result)],
      returnBuffer && buffer ? [buffer] : undefined);
    _.buffer = null;
  };

  /**
   * @param {!ImageData} imgdata image to
   * @param {boolean} isBinary
   * @param {?Array.<!w69b.BarcodeFormat>=} opt_formats
   * @param {boolean=} opt_failOnCharset immediately fail on charset error if
   *                                     true, do not try to load iconv. decode.
   */
  _.decode = function(imgdata, isBinary, opt_formats, opt_failOnCharset) {
    let result;
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
        _.send(WorkerMessageType.NOTFOUND, err && err.message, true);
        return;
      } else {
        throw err;
      }
    }
    _.send(WorkerMessageType.DECODED, result, true);
  };

  /**
   * Decode barcode from ImageData.
   * @param {!ImageData} imgdata from canvas.
   * @param {boolean} isBinary
   * @param {?Array.<!w69b.BarcodeFormat>=} opt_formats
   * @param {?w69b.ResultPointCallback=} opt_callback callback.
   * @return {!w69b.Result} decoded barcode.
   * @throws {!w69b.NotFoundException} if nothing found
   */
  _.decodeFromImageData = function(imgdata, isBinary, opt_formats, opt_callback) {
    if (multiFormatReader === null) {
      multiFormatReader = new w69b.MultiFormatReader();

      const opt_hints = (opt_formats || opt_callback) ? {} : undefined;

      if (opt_callback) {
        opt_hints[DecodeHintType.NEED_RESULT_POINT_CALLBACK] = opt_callback;
      }

      if (opt_formats) {
        opt_hints[DecodeHintType.POSSIBLE_FORMATS] = opt_formats;
      }

      if (opt_hints !== undefined) {
        multiFormatReader.setHints(opt_hints);
      }
    }

    // Reuse the array for luminance source whenever possible
    if (grayscaleArray === null) {
      grayscaleArray = new Int8Array(imgdata.width * imgdata.height);
    } else {
      if (grayscaleArray.length !== imgdata.width * imgdata.height) {
        grayscaleArray = new Int8Array(imgdata.width * imgdata.height);
      }
    }

    const luminanceSource = new w69b.ImageDataLuminanceSource(
      imgdata, grayscaleArray);

    let binarizer;
    if (isBinary) {
      binarizer = new w69b.common.NoOpBinarizer(luminanceSource);
    } else {
      binarizer = new w69b.common.HybridBinarizer(luminanceSource);
    }
    const bitmap = new w69b.BinaryBitmap(binarizer);

    try {
      return multiFormatReader.decodeWithState(bitmap);
    } finally {
      multiFormatReader.reset();
    }
  };

  /**
   * @param {!ResultPoint} pattern found.
   */
  _.onPatternFound = function(pattern) {
    // Build plain json object.
    _.send(WorkerMessageType.PATTERN, pattern);
  };

  /**
   * Received message from host.
   * @param {!MessageEvent} event
   */
  self.onmessage = function(event) {
    const data = event.data;
    // Message only sent for feature detection of transferable objects.
    if (data['isfeaturedetect']) {
      // do nothing.
    } else if (data['setIconvUrl']) {
      _.iconvPath = data['setIconvUrl'];
    } else {
      // decode
      const width = data['width'];
      const height = data['height'];
      const buffer = data['buffer'];
      const formats = data['formats'];
      const isBinary = data['isBinary'] || false;
      const isGrayscale = data['isGrayscale'];
      if (!buffer.byteLength) {
        throw new Error('worker commmunication failed');
      }
      const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
      imageData.grayscale_ = isGrayscale;
      _.buffer_ = buffer;
      _.decode(imageData, isBinary, formats);
    }
  };
});
