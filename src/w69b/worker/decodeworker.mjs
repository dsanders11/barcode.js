// (c) 2013 Manuel Braun (mb@w69b.com)

import { BinaryBitmap } from '/w69b/binarybitmap.mjs';
import { HybridBinarizer } from '/w69b/common/hybridbinarizer.mjs';
import { NoOpBinarizer } from '/w69b/common/noopbinarizer.mjs';

goog.declareModuleId('es6.w69b.worker.DecodeWorker');

const DecodeHintType = goog.require('w69b.DecodeHintType');
const ImageDataLuminanceSource = goog.require('w69b.ImageDataLuminanceSource');
const InvalidCharsetException = goog.require('w69b.InvalidCharsetException');
const MultiFormatReader = goog.require('w69b.MultiFormatReader');
const NotFoundException = goog.require('w69b.NotFoundException');
const WorkerMessageType = goog.require('w69b.worker.WorkerMessageType');

let multiFormatReader = null;
let grayscaleArray = null;

export class DecodeWorker {
  /**
   * @param {string} msgType messsage type.
   * @param {*} result value.
   * @param {boolean=} returnBuffer
   */
  static send(msgType, result, returnBuffer = false) {
    // As a work around to a memory leak in Firefox and Chrome, always transfer
    // the buffer back to the main thread once we are done using it
    const buffer = DecodeWorker.buffer_;
    self.postMessage([msgType, JSON.stringify(result)],
      returnBuffer && buffer ? [buffer] : undefined);
    DecodeWorker.buffer = null;
  }

  /**
   * @param {!ImageData} imgdata image to
   * @param {boolean} isBinary
   * @param {?Array.<!w69b.BarcodeFormat>=} opt_formats
   * @param {boolean=} opt_failOnCharset immediately fail on charset error if
   *                                     true, do not try to load iconv. decode.
   */
  static decode(imgdata, isBinary, opt_formats, opt_failOnCharset) {
    let result;
    try {
      result = DecodeWorker.decodeFromImageData(imgdata, isBinary, opt_formats, DecodeWorker.onPatternFound);
    } catch (err) {
      if (err instanceof InvalidCharsetException && !self.iconv &&
        DecodeWorker.iconvPath && !opt_failOnCharset) {
        // load iconv.
        importScripts(DecodeWorker.iconvPath);
        // and try again.
        DecodeWorker.decode(imgdata, true);
        return;
      } else if (err instanceof NotFoundException) {
        DecodeWorker.send(WorkerMessageType.NOTFOUND, err && err.message, true);
        return;
      } else {
        throw err;
      }
    }
    DecodeWorker.send(WorkerMessageType.DECODED, result, true);
  }

  /**
   * Decode barcode from ImageData.
   * @param {!ImageData} imgdata from canvas.
   * @param {boolean} isBinary
   * @param {?Array.<!w69b.BarcodeFormat>=} opt_formats
   * @param {?w69b.ResultPointCallback=} opt_callback callback.
   * @return {!w69b.Result} decoded barcode.
   * @throws {!w69b.NotFoundException} if nothing found
   */
  static decodeFromImageData(imgdata, isBinary, opt_formats, opt_callback) {
    if (multiFormatReader === null) {
      multiFormatReader = new MultiFormatReader();

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

    const luminanceSource = new ImageDataLuminanceSource(imgdata, grayscaleArray);

    let binarizer;
    if (isBinary) {
      binarizer = new NoOpBinarizer(luminanceSource);
    } else {
      binarizer = new HybridBinarizer(luminanceSource);
    }
    const bitmap = new BinaryBitmap(binarizer);

    try {
      return multiFormatReader.decodeWithState(bitmap);
    } finally {
      multiFormatReader.reset();
    }
  }

  /**
   * @param {!w69b.ResultPoint} pattern found.
   */
  static onPatternFound(pattern) {
    // Build plain json object.
    DecodeWorker.send(WorkerMessageType.PATTERN, pattern);
  }
}

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
    DecodeWorker.iconvPath = data['setIconvUrl'];
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
    DecodeWorker.buffer_ = buffer;
    DecodeWorker.decode(imageData, isBinary, formats);
  }
};

DecodeWorker.iconvPath = 'iconv.js';
