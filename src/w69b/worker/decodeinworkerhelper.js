// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.worker.DecodeInWorkerHelper');
goog.require('goog.math.Size');
goog.require('goog.net.jsloader');
goog.require('goog.string');
goog.require('goog.string.path');
goog.require('goog.userAgent.product');
goog.require('w69b.InvalidCharsetException');
goog.require('w69b.imgtools');
goog.require('w69b.qr.imagedecoding');
goog.require('w69b.webgl.WebGLBinarizer');
goog.require('w69b.worker.WorkerMessageType');


goog.scope(function() {
  var jsloader = goog.net.jsloader;
  var WorkerMessageType = w69b.worker.WorkerMessageType;
  var WebGLBinarizer = w69b.webgl.WebGLBinarizer;

  /**
   * Helper class that decodes in worker if available and reasonable
   * and falls back to main thread decoding if not.
   * @constructor
   * @param {Array=} opt_formats Formats to decode for
   */
  w69b.worker.DecodeInWorkerHelper = function(opt_formats) {
    this.callback_ = null;
    this.formats_ = opt_formats;
  };
  var DecodeInWorkerHelper = w69b.worker.DecodeInWorkerHelper;
  var pro = DecodeInWorkerHelper.prototype;

  /**
   * @type {boolean}
   * @private
   */
  pro.enableWebGl_ = true;

  /**
   * @type {boolean}
   * @private
   */
  pro.enableWorker_ = true;

  /**
   * Initialized with binarizer if supported.
   * @type {WebGLBinarizer}
   * @private
   */
  pro.webGLBinarizer_ = null;

  /**
   * @type {boolean}
   * @private
   */
  pro.useWorker_ = false;

  /**
   * @type {Worker}
   * @private
   */
  pro.worker_ = null;

  /**
   * @private
   * Set this according to your setup.
   * @type {string} url of worker js file.
   */
  DecodeInWorkerHelper.workerUrl_ = '';
  /**
   * @private
   * Set this if you want to use iconv when needed.
   * @type {?string} url of iconv.js file.
   */
  DecodeInWorkerHelper.iconvUrl_ = null;

  /**
   * Set this according to your setup before creating an instance.
   * @param {string} url of worker js file.
   */
  DecodeInWorkerHelper.setWorkerUrl = function(url) {
    DecodeInWorkerHelper.workerUrl_ = url;
  };

  /**
   * Set this if you want to use iconv when needed. Relative paths are
   * relative to the worker url.
   * @param {string} url of iconv.js file.
   */
  DecodeInWorkerHelper.setIconvUrl = function(url) {
    DecodeInWorkerHelper.iconvUrl_ = url;
  };

  /**
   * Enable or disable WebGl binarizer.
   * @param {boolean} enable WebGL.
   */
  pro.enableWebGl = function(enable) {
    this.enableWebGl_ = enable;
  };

  /**
   * Enable or disable decoding in web worker.
   * @param {boolean} enable worker.
   */
  pro.enableWorker = function(enable) {
    this.enableWorker_ = enable;
  };

  /**
   * Initialize class. You must call this before using it.
   */
  pro.init = function() {
    if (this.enableWorker_) {
      var url = w69b.worker.DecodeInWorkerHelper.workerUrl_;
      if (!url)
        throw Error('missing worker url setup');
      this.worker_ = new Worker(url);
      this.useWorker_ = this.shallUseWorker();
      if (this.useWorker_) {
        // hack for invalid extern.
        this.worker_['addEventListener']('message', this.onMessage_.bind(this));
        if (w69b.worker.DecodeInWorkerHelper.iconvUrl_) {
          this.worker_.postMessage(
            {'setIconvUrl': w69b.worker.DecodeInWorkerHelper.iconvUrl_});
        }
      } else {
        this.worker_.terminate();
        this.worker_ = null;
      }
    }
  };

  /**
   * Check if WebGl is used.
   * @return {boolean} true if webGl is enabled and supported
   */
  pro.isWebGlEnabledAndSupported = function() {
    return this.enableWebGl_ && WebGLBinarizer.isSupported();
  };

  /**
   * Only use workers in browsers that support transferable objects.
   * @return {boolean} true if should use worker
   */
  pro.shallUseWorker = function() {
    if (!this.enableWorker_) return false;
    var buffer = new ArrayBuffer(1);
    this.worker_.postMessage(
      {'isfeaturedetect': true, 'buffer': buffer}, [buffer]);
    // When buffer is transfered and not copied, its length is set to zero.
    return buffer.byteLength == 0;
  };

  /**
   * Message form worker received
   * @param {MessageEvent} event
   * @private
   */
  pro.onMessage_ = function(event) {
    if (this.callback_) {
      var type = event.data[0];
      // Hack for FF memory leak with webgl + worker.
      if (type == 'ffmemoryhack')
        return;
      var value = event.data[1];
      if (value)
        value = window.JSON.parse(/** @type {string} */ (value));
      this.callback_(type, value);
    }
  };

  /**
   * @param {!(HTMLCanvasElement|ImageData|Image|HTMLImageElement|HTMLVideoElement)} imgdata frame to process.
   * @param {!goog.math.Size} size of image data, or desired size of binarizer output in
   * case webGl is used. If aspect ratio is different from input espect ratio, we only use the
   * top-left rectange of the input image that covers the desired size.
   * @param {function(string, ?=)} callback called with result..
   */
  pro.decode = function(imgdata, size, callback) {
    var isBinary = false;
    var imgDataOrMatrix = imgdata;
    size.round();
    if (this.enableWebGl_) {
      // lazzily initialize binarizer
      if (!this.webGLBinarizer_ && WebGLBinarizer.isSupported()) {
        this.webGLBinarizer_ = new WebGLBinarizer();
      }
      // binarize
      if (this.webGLBinarizer_) {
        var coverSize = new goog.math.Size(
          /** @type {number} */ (imgdata.width || imgdata.videoWidth),
          /** @type {number} */ (imgdata.height || imgdata.videoHeight));
        if (coverSize.fitsInside(size)) {
          size = coverSize;
        } else {
          coverSize = coverSize.scaleToCover(size);
        }
        this.webGLBinarizer_.setup(size.width, size.height, coverSize.width, coverSize.height);
        this.webGLBinarizer_.render(imgdata);
        imgDataOrMatrix = this.webGLBinarizer_.getImageData();
        isBinary = true;
        // window.console.log('decoded with webgl');
      }
    }
    if (!(imgDataOrMatrix instanceof ImageData)) {
      imgDataOrMatrix = w69b.imgtools.getImageData(imgDataOrMatrix, size);
    }
    if (this.useWorker_) {
      var buffer = (/** @type {Uint8ClampedArray}  */ (imgDataOrMatrix.data)).buffer;
      var msg = {
        'width': imgDataOrMatrix.width,
        'height': imgDataOrMatrix.height,
        'buffer': buffer,
        'formats': this.formats_,
        'isFirefox': Boolean(goog.userAgent.product.FIREFOX),
        'isBinary': isBinary,
        'isGrayscale': imgDataOrMatrix.grayscale_
      };
      this.callback_ = callback;
      this.worker_.postMessage(msg, [buffer]);
    } else {
      // local fallback
      this.decodeLocalFallback_(imgDataOrMatrix, isBinary, callback);
    }
  };

  /**
   * Dispose helper
   */
  pro.dispose = function() {
    if (this.worker_)
      this.worker_.terminate();
  };

  /**
   * @private
   * @param {!ImageData} imgdata image data.
   * @param {boolean} isBinary
   * @param {function(string, ?=)} callback called with result..
   */
  pro.decodeLocalFallback_ = function(imgdata, isBinary, callback) {
    try {
      var result = w69b.qr.imagedecoding.decodeFromImageData(imgdata, isBinary, this.formats_, function(pattern) {
        callback(WorkerMessageType.PATTERN, pattern['toJSON']());
      }.bind(this));
    } catch (err) {
      if (err instanceof w69b.InvalidCharsetException && !self.iconv &&
        DecodeInWorkerHelper.iconvUrl_) {
        // load iconv. importScripts(_.iconvPath);
        var url = DecodeInWorkerHelper.iconvUrl_;
        if (!goog.string.startsWith(url,
            'http://') && !goog.string.startsWith(url, 'https://')) {
          // path is relative to worker, so resolve it first.
          url = goog.string.path.dirname(DecodeInWorkerHelper.workerUrl_) +
            '/' + url;
        }
        // And try again when loaded.
        jsloader.load(url).addCallback(function() {
          this.decodeLocalFallback_(imgdata, isBinary, callback);
        }, this);
        return;
      } else {
        throw err;
      }
    }
    if (result.isError()) {
      var err = result.getError();
      callback(WorkerMessageType.NOTFOUND, err && err.message);
    } else {
      callback(WorkerMessageType.DECODED, result['toJSON']());
    }
    // hack to work arout memory leak in FF
    delete imgdata.data;
  };
});
