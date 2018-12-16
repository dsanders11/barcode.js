// (c) 2013 Manuel Braun (mb@w69b.com)

import { DecodeWorker } from './decodeworker.mjs';
import * as imgtools from '/w69b/imgtools.js';

const GoogString = goog.require('goog.string');
const InvalidCharsetException = goog.require('w69b.InvalidCharsetException');
const NotFoundException = goog.require('w69b.NotFoundException');
const Size = goog.require('goog.math.Size');
const WebGLBinarizer = goog.require('w69b.webgl.WebGLBinarizer');
const WorkerMessageType = goog.require('w69b.worker.WorkerMessageType');
const jsloader = goog.require('goog.net.jsloader');
const legacyconversions = goog.require('goog.html.legacyconversions');
const path = goog.require('goog.string.path');

/**
 * Helper class that decodes in worker if available and reasonable
 * and falls back to main thread decoding if not.
 */
export class DecodeInWorkerHelper {
  /**
   * @param {!Array.<!w69b.BarcodeFormat>=} opt_formats Formats to decode for
   */
  constructor(opt_formats) {
    this.callback_ = null;
    this.formats_ = opt_formats;

    /**
     * @type {boolean}
     * @private
     */
    this.enableWebGl_ = true;

    /**
     * @type {boolean}
     * @private
     */
    this.enableWorker_ = true;

    /**
     * Initialized with binarizer if supported.
     * @type {?WebGLBinarizer}
     * @private
     */
    this.webGLBinarizer_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.useWorker_ = false;

    /**
     * @type {?Worker}
     * @private
     */
    this.worker_ = null;
  }

  /**
   * Set this according to your setup before creating an instance.
   * @param {string} url of worker js file.
   */
  static setWorkerUrl(url) {
    DecodeInWorkerHelper.workerUrl_ = url;
  }

  /**
   * Set this if you want to use iconv when needed. Relative paths are
   * relative to the worker url.
   * @param {string} url of iconv.js file.
   */
  static setIconvUrl(url) {
    DecodeInWorkerHelper.iconvUrl_ = url;
  }

  /**
   * Enable or disable WebGl binarizer.
   * @param {boolean} enable WebGL.
   */
  enableWebGl(enable) {
    this.enableWebGl_ = enable;
  }

  /**
   * Enable or disable decoding in web worker.
   * @param {boolean} enable worker.
   */
  enableWorker(enable) {
    this.enableWorker_ = enable;
  }

  /**
   * Initialize class. You must call this before using it.
   */
  init() {
    if (this.enableWorker_) {
      const url = DecodeInWorkerHelper.workerUrl_;
      if (!url)
        throw new Error('missing worker url setup');
      this.worker_ = new Worker(url);
      this.useWorker_ = this.shallUseWorker();
      if (this.useWorker_) {
        // hack for invalid extern.
        this.worker_.addEventListener('message', event => {
          this.onMessage_(/** @type {!MessageEvent} */ (event));
        });
        if (DecodeInWorkerHelper.iconvUrl_) {
          this.worker_.postMessage(
            {'setIconvUrl': DecodeInWorkerHelper.iconvUrl_});
        }
      } else {
        this.worker_.terminate();
        this.worker_ = null;
      }
    }
  }

  /**
   * Check if WebGl is used.
   * @return {boolean} true if webGl is enabled and supported
   */
  isWebGlEnabledAndSupported() {
    return this.enableWebGl_ && WebGLBinarizer.isSupported();
  }

  /**
   * Only use workers in browsers that support transferable objects.
   * @return {boolean} true if should use worker
   */
  shallUseWorker() {
    if (!this.enableWorker_) return false;
    const buffer = new ArrayBuffer(1);
    this.worker_.postMessage(
      {'isfeaturedetect': true, 'buffer': buffer}, [buffer]);
    // When buffer is transfered and not copied, its length is set to zero.
    return buffer.byteLength === 0;
  }

  /**
   * Message form worker received
   * @param {!MessageEvent} event
   * @private
   */
  onMessage_(event) {
    if (this.callback_) {
      const type = event.data[0];
      let value = event.data[1];
      if (value) {
        value = JSON.parse(/** @type {string} */ (value));
      }
      this.callback_(type, value);
    }
  }

  /**
   * @param {!CanvasImageSource|!ImageData} imgdata frame to process.
   * @param {!goog.math.Size} size of image data, or desired size of binarizer output in
   * case webGl is used. If aspect ratio is different from input espect ratio, we only use the
   * top-left rectange of the input image that covers the desired size.
   * @param {function(string, ?=)} callback called with result..
   */
  decode(imgdata, size, callback) {
    let isBinary = false;
    // TODO - Rename
    let imgDataOrMatrix = imgdata;
    size.round();
    if (this.enableWebGl_) {
      // lazzily initialize binarizer
      if (!this.webGLBinarizer_ && WebGLBinarizer.isSupported()) {
        this.webGLBinarizer_ = new WebGLBinarizer();
      }
      // binarize
      if (this.webGLBinarizer_) {
        let coverSize = new Size(
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
      imgDataOrMatrix = imgtools.getImageData(imgDataOrMatrix, size);
    }
    if (this.useWorker_) {
      const buffer = (/** @type {!Uint8ClampedArray} */ (imgDataOrMatrix.data)).buffer;
      const msg = {
        'width': imgDataOrMatrix.width,
        'height': imgDataOrMatrix.height,
        'buffer': buffer,
        'formats': this.formats_,
        'isBinary': isBinary,
        'isGrayscale': imgDataOrMatrix.grayscale_
      };
      this.callback_ = callback;
      this.worker_.postMessage(msg, [buffer]);
      imgDataOrMatrix = null;
    } else {
      // local fallback
      this.decodeLocalFallback_(imgDataOrMatrix, isBinary, callback);
    }
  }

  /**
   * Dispose helper
   */
  dispose() {
    if (this.worker_) {
      this.worker_.terminate();
    }
  }

  /**
   * @private
   * @param {!ImageData} imgdata image data.
   * @param {boolean} isBinary
   * @param {function(string, ?=)} callback called with result..
   */
  decodeLocalFallback_(imgdata, isBinary, callback) {
    try {
      const result = DecodeWorker.decodeFromImageData(
        imgdata, isBinary, this.formats_, pattern => {
          callback(WorkerMessageType.PATTERN, pattern['toJSON']());
        }
      );

      callback(WorkerMessageType.DECODED, result['toJSON']());
    } catch (err) {
      if (err instanceof InvalidCharsetException && !self.iconv &&
        DecodeInWorkerHelper.iconvUrl_) {
        // load iconv. importScripts(_.iconvPath);
        let url = DecodeInWorkerHelper.iconvUrl_;
        if (!GoogString.startsWith(url,
            'http://') && !GoogString.startsWith(url, 'https://')) {
          // path is relative to worker, so resolve it first.
          url = path.dirname(DecodeInWorkerHelper.workerUrl_) + '/' + url;
        }
        // And try again when loaded.
        const trustedUrl = legacyconversions.trustedResourceUrlFromString(url);
        jsloader.safeLoad(trustedUrl).addCallback(function() {
          this.decodeLocalFallback_(imgdata, isBinary, callback);
        }, this);
        return;
      } else if (err instanceof NotFoundException) {
        callback(WorkerMessageType.NOTFOUND, err && err.message);
        return;
      } else {
        throw err;
      }
    }

    // hack to work arout memory leak in FF
    delete imgdata.data;
  }
}

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