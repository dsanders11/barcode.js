// Copyright 2015 Manuel Braun (mb@w69b.com). All Rights Reserved.

import { DecodeInWorkerHelper } from '/w69b/worker/decodeinworkerhelper.js';

const Size = goog.require('goog.math.Size');
const WebGLBinarizer = goog.require('w69b.webgl.WebGLBinarizer');
const WorkerMessageType = goog.require('w69b.worker.WorkerMessageType');

/**
 * Public high-level decoding API exports.
 */

/**
 * Set this according to your setup before creating an instance.
 * @param {string} url of worker js file.
 */
export function setWorkerUrl(url) {
  DecodeInWorkerHelper.setWorkerUrl(url);
}

/**
 * Set this if you want to use iconv when needed. Relative paths are
 * relative to the worker url.
 * @param {string} url of iconv.js file.
 */
export function setIconvUrl(url) {
  DecodeInWorkerHelper.setIconvUrl(url);
}

/**
 * Check WebGl image processing support.
 * @return {boolean} whether WebGL binarizer can be used.
 */
export function isWebGlSupported() {
  return WebGLBinarizer.isSupported();
}

/**
 * Class to decode barcode images. Loads a worker at initialization, if enabled,
 * so make sure to re-use instances whenever possible.
 */
export class Decoder {
  /**
   * @param {!Object<string,*>=} opt_options options with the following properties:
   * - {boolean} worker: use web worker, if supported, defaults to true
   * - {boolean} webgl: use webgl binarizer, if supported, defaults to true
   * - {number} maxSize: scale down image if large than this value in any dimension.
   *  Defaults to 700px.
   */
  constructor(opt_options) {
    const opt = {
      'worker': true,
      'webgl': true,
      'maxSize': 700,
      'formats': null,
      ...opt_options
    };
    const worker = new DecodeInWorkerHelper();
    worker.enableWebGl(opt['webgl']);
    worker.enableWorker(opt['worker']);
    worker.init();
    this.options_ = opt;
    this.worker_ = worker;
    this.busy_ = false;
  }

  /**
   * Release resources.
   */
  dispose() {
    this.worker_.dispose();
  }

  /**
   * Decode image that contains a barcode. It can handle image/video and imagedata objects.
   * Note that image conversion is expensive, so pass your image as-is whenever possible.
   * @param {!CanvasImageSource|!ImageData} img image to decode.
   * @return {!Promise} result. Resolves to an object
   * with a text property that contains the decoded string on success.
   * Rejects if no barcode could be found or decoding failed.
   */
  async decode(img) {
    if (this.busy_) {
      throw new Error('Decoder is still busy');
    }
    this.busy_ = true;
    const opt = this.options_;
    const worker = this.worker_;
    // Size of down-scaled image used for decoding internally.
    let size = new Size(
      /** @type {number} */ (img.width || img.videoWidth),
      /** @type {number} */ (img.height || img.videoHeight));
    if (opt['maxSize']) {
      const maxSize = new Size(opt['maxSize'], opt['maxSize']);
      if (!size.fitsInside(maxSize)) {
        size = size.scaleToFit(maxSize);
        size.floor();
      }
    }
    
    const promise = new Promise((resolve, reject) => {
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
    });

    try {
      return await promise;
    } finally {
      this.busy_ = false;
    }
  }
}

goog.exportSymbol('w69b.decoding.setWorkerUrl', setWorkerUrl);
goog.exportSymbol('w69b.decoding.setIconvUrl', setIconvUrl);
goog.exportSymbol('w69b.decoding.isWebGlSupported', isWebGlSupported);
goog.exportSymbol('w69b.decoding.Decoder', Decoder);
