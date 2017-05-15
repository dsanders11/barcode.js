// Copyright 2015 Manuel Braun (mb@w69b.com). All Rights Reserved.

// Public API exports
goog.provide('w69b.decoding');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('w69b.webgl.WebGLBinarizer');
goog.require('w69b.worker.DecodeInWorkerHelper');


/**
 * Public high-level decoding API exports.
 * @author mb@w69b.com (Manuel Braun)
 */
goog.scope(function() {
  const WorkerMessageType = w69b.worker.WorkerMessageType;
  const DecodeInWorkerHelper = w69b.worker.DecodeInWorkerHelper;
  const object = goog.object;
  const _ = w69b.decoding;

  /**
   * Set this according to your setup before creating an instance.
   * @param {string} url of worker js file.
   * @export
   */
  _.setWorkerUrl = function(url) {
    DecodeInWorkerHelper.setWorkerUrl(url);
  };

  /**
   * Set this if you want to use iconv when needed. Relative paths are
   * relative to the worker url.
   * @param {string} url of iconv.js file.
   * @export
   */
  _.setIconvUrl = function(url) {
    DecodeInWorkerHelper.setIconvUrl(url);
  };

  /**
   * Check WebGl image processing support.
   * @return {boolean} whether WebGL binarizer can be used.
   * @export
   */
  _.isWebGlSupported = function() {
    return w69b.webgl.WebGLBinarizer.isSupported();
  };

  /**
   * Class to decode barcode images. Loads a worker at initialization, if enabled,
   * so make sure to re-use instances whenever possible.
   * @param {Object<string,*>=} opt_options options with the following properties:
   * - {boolean} worker: use web worker, if supported, defaults to true
   * - {boolean} webgl: use webgl binarizer, if supported, defaults to true
   * - {number} maxSize: scale down image if large than this value in any dimension.
   *  Defaults to 700px.
   * @constructor
   * @export
   */
  _.Decoder = function(opt_options) {
    var opt = {
      'worker': true,
      'webgl': true,
      'maxSize': 700,
      'formats': null
    };
    object.extend(opt, opt_options || {});
    var worker = new DecodeInWorkerHelper();
    worker.enableWebGl(opt['webgl']);
    worker.enableWorker(opt['worker']);
    worker.init();
    this.options_ = opt;
    this.worker_ = worker;
    this.busy_ = false;
  };

  /**
   * Release resources.
   * @export
   */
  _.Decoder.prototype.dispose = function() {
    this.worker_.dispose();
  };

  /**
   * Decode image that contains a barcode. It can handle image/video and imagedata objects.
   * Note that image conversion is expensive, so pass your image as-is whenever possible.
   * @param {!(CanvasImageSource|ImageData)} img image to decode.
   * @return {!Promise} result. Resolves to an object
   * with a text property that contains the decoded string on success.
   * Rejects if no barcode could be found or decoding failed.
   * @export
   */
  _.Decoder.prototype.decode = function(img) {
    if (this.busy_) {
      throw new Error('Decoder is still busy');
    }
    this.busy_ = true;
    var that = this;
    var opt = this.options_;
    var worker = this.worker_;
    // Size of down-scaled image used for decoding internally.
    var size = new goog.math.Size(
      /** @type {number} */ (img.width || img.videoWidth),
      /** @type {number} */ (img.height || img.videoHeight));
    if (opt['maxSize']) {
      let maxSize = new goog.math.Size(opt['maxSize'], opt['maxSize']);
      if (!size.fitsInside(maxSize)) {
        size = size.scaleToFit(maxSize);
        size.floor();
      }
    }
    return new Promise(function(resolve, reject) {
      worker.decode(img, size,
        /**
         * @param {string} type
         * @param {?=} opt_value
         */
        function(type, opt_value) {
          switch (type) {
            case WorkerMessageType.DECODED:
              resolve(opt_value);
              break;
            case WorkerMessageType.NOTFOUND:
              reject(opt_value ? new Error(opt_value) : "");
              break;
            case WorkerMessageType.PATTERN:
              // Do nothing
              break;
            default:
              reject();
              break;
          }
        }
      );
    }).then(function(value) {
      // fulfillment
      that.busy_ = false;

      return value;
    }, function(reason) {
      // rejection
      that.busy_ = false;

      throw reason;
    });
  };
});
