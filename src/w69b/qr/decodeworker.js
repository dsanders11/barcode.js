// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.qr.DecodeWorker');
goog.require('goog.userAgent.product');
goog.require('w69b.InvalidCharsetException');
goog.require('w69b.ResultPoint');
goog.require('w69b.qr.WorkerMessageType');
goog.require('w69b.qr.imagedecoding');


// Hack to work arround closure warnings.
var host = self;

goog.scope(function() {
  var WorkerMessageType = w69b.qr.WorkerMessageType;
  var ResultPoint = w69b.ResultPoint;

  var _ = w69b.qr.DecodeWorker;
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
   * @param {boolean=} opt_failOnCharset immediately fail on charset error if
   *                                     true, do not try to load iconv. decode.
   */
  _.decode = function(imgdata, isBinary, opt_failOnCharset) {
    var result;
    try {
      result = w69b.qr.imagedecoding.decodeFromImageData(imgdata, isBinary, _.onPatternFound);
    } catch (err) {
      if (err instanceof w69b.InvalidCharsetException && !self.iconv &&
        _.iconvPath && !opt_failOnCharset) {
        // load iconv.
        importScripts(_.iconvPath);
        // and try again.
        _.decode(imgdata, true);
        return;
      } else {
        throw err;
      }
    }
    if (result.isError()) {
      var err = result.getError();
      _.send(WorkerMessageType.NOTFOUND, err && err.message);
    } else {
      _.send(WorkerMessageType.DECODED, result);
    }
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
      var isBinary = data['isBinary'] || false;
      if (!buffer.byteLength) {
        throw Error('worker commmunication failed');
      }
      var imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
      _.decode(imageData, isBinary);
      // Hack for FF memory leak - if webgl is used, we tranfer back the
      // buffer as a workaround.
      if (goog.userAgent.product.FIREFOX) {
        host.postMessage(['ffmemoryhack', null], [buffer]);
        event.data['buffer'] = null;
        // event.data = null;
      }
    }
  };
});
