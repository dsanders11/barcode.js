// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.qr.DecodeWorker');
goog.require('goog.userAgent.product');
goog.require('w69b.InvalidCharsetException');
goog.require('w69b.img.RGBABitMatrix');
goog.require('w69b.qr.QRImage');
goog.require('w69b.qr.WorkerMessageType');
goog.require('w69b.qr.detector.AlignmentPattern');
goog.require('w69b.qr.detector.FinderPattern');
goog.require('w69b.qr.imagedecoding');


// Hack to work arround closure warnings.
var host = self;

goog.scope(function() {
  var qrcode = w69b.qr.imagedecoding;
  var WorkerMessageType = w69b.qr.WorkerMessageType;
  var AlignmentPattern = w69b.qr.detector.AlignmentPattern;
  var FinderPattern = w69b.qr.detector.FinderPattern;

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
   * @param {(!w69b.qr.QRImage|!w69b.img.RGBABitMatrix)} imgdata image to
   * @param {boolean=} opt_failOnCharset immediately fail on charset error if
   *                                     true, do not try to load iconv. decode.
   */
  _.decode = function(imgdata, opt_failOnCharset) {
    var result;
    try {
      result = qrcode.decodeFromImageData(imgdata, _.onPatternFound);
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
   * @param {(AlignmentPattern|FinderPattern)} pattern found.
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
      var isBinary = data['isBinary'];
      if (!buffer.byteLength) {
        throw Error('worker commmunication failed');
      }
      var image;
      if (isBinary) {
        image = new w69b.img.RGBABitMatrix(width, height,
          new Uint8ClampedArray(buffer));
      } else {
        image = new w69b.qr.QRImage(width, height,
          new Uint8ClampedArray(buffer));
      }
      _.decode(image);
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
