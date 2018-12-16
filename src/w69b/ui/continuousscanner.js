// (c) 2013 Manuel Braun (mb@w69b.com)

import { DecodeInWorkerHelper } from '/w69b/worker/decodeinworkerhelper.js'
import { LocalVideoCapturer } from './localvideocapturer.js'
import * as imgtools from '/w69b/imgtools.js';

const Component = goog.require('goog.ui.Component');
const Size = goog.require('goog.math.Size');
const WorkerMessageType = goog.require('w69b.worker.WorkerMessageType');
const events = goog.require('goog.events');
const string = goog.require('goog.string');
const style = goog.require('goog.style');
const userAgent = goog.require('goog.userAgent');

export class PatternPoint {
  /**
   * @param {number} x x pos.
   * @param {number} y y pos.
   * @param {number} size pattern size.
   */
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size || 4;
    this.birthTime = Date.now();
  }
}

/**
 * Component that shows visualization of continuous scanning.
 */
export class ContinuousScanner extends Component {
  /**
   * @param {!Object=} opt_options
   */
  constructor(opt_options) {
    super();

    const opt = {
      'webgl': true,
      'maxFPS': 25,
      'capturer': undefined,
      ...opt_options
    };

    if (opt['capturer'] !== undefined) {
      this.capturer_ = opt['capturer']
    } else {
      this.capturer_ = new LocalVideoCapturer(opt['videoConstraints']);
    }

    this.worker_ = new DecodeInWorkerHelper(opt['formats']);
    this.worker_.enableWebGl(opt['webgl']);
    this.worker_.init();
    this.lastFrameTime_ = null;
    this.timeBetweenFrames_ = 1000/opt['maxFPS'];

    /**
     * Size of visualization.
     * @type {!Size}
     * @private
     */
    this.size_ = new Size(200, 200);

    /**
     * Size of decoding image.
     * @type {!Size}
     * @private
     */
    this.decodeSize_ = new Size(200, 200);

    /**
     * We use a simple callback instead of events to be independent of
     * closure.
     * @private
     */
    this.decodedCallback_ = goog.nullFunction;

    /**
     * @private
     */
    this.notFoundCallback_ = goog.nullFunction;

    /**
     * Canvas element used for visualization.
     * @type {?HTMLCanvasElement}
     * @private
     */
    this.visualizationCanvas_ = null;

    /**
     * Rendering context of visualization canvas.
     * @type {?CanvasRenderingContext2D}
     * @private
     */
    this.visualizationContext_ = null;

    /**
     * Tuples of found pattern positions.
     * @type {!Array.<!PatternPoint>}
     * @private
     */
    this.foundPatterns_ = [];

    /**
     * Whether decoder is currently decoding.
     * @type {boolean}
     * @private
     */
    this.isDecoding_ = false;

    /**
     * Max resolution (max dimension) used for visualization. Allows to reduce
     * resolution to hopefully get a higher performance. If set to 0, the full
     * element size is used.
     * @private
     * @type {number}
     */
    this.maxVisualizationResolution_ = 0;

    /**
     * Maximal resolution used for decoding. If set to 0, visualization
     * resolution is used.
     * @type {number}
     * @private
     */
    this.maxDecodeResolution_ = 500;

    /**
     * Maximal age (in ms) of pattern visualization dots.
     * resolution is used.
     * @type {number}
     * @private
     */
    this.maxPatternAge_ = 500;

    /**
     * @type {number}
     * @private
     */
    this.animFrameRequestId_ = 0;

    /**
     * @type {number}
     * @private
     */
    this.timerRequestId_ = 0;

    /**
     *
     * @type {boolean}
     * @private
     */
    this.stopped_ = false;
  }

  /**
   * @return {boolean} if getUserMedia (and so continuous scanning)
   * is supported.
   */
  static isSupported() {
    // If api is not present it's clearly not supported.
    if (!LocalVideoCapturer.isSupported()) {
      return false;
    }
    // But feature detection does not work as browsers lie about their
    // capabilities, so sniff versions and blacklist some.
    // It is supported for Chrome >= 21, Opera => 12, FF >= 20, FFOS 1.4
    // (FF mobile 30)
    const ua = userAgent.getUserAgentString() || '';
    let match = /Chrome\/(\d+)/.exec(ua);
    if (match && match[1] < 21) {
      return false;
    }
    match = /Firefox\/(\d+)/.exec(ua);
    if (match && (match[1] < 20 ||
      (match[1] < 29 && (
        string.contains(ua, 'Mobile') ||
        string.contains(ua, 'Android') ||
        string.contains(ua, 'iPhone') ||
        string.contains(ua, 'iPad')
      )))) {
      return false;
    }
    return true;
  }

  /**
   * Is the scanner currently capturing video
   * @return {boolean}
   */
  isCapturing() {
    return this.capturer_.isCapturing();
  }

  /**
   * Set callback that is called when a text was decoded.
   * @param {function(string, w69b.BarcodeFormat)} callback function that takes the decoded
   * string as argument.
   */
  setDecodedCallback(callback) {
    this.decodedCallback_ = callback;
  }

  /**
   * Set callback that is called when no barcode was found
   * @param {function()} callback function
   */
  setNotFoundCallback(callback) {
    this.notFoundCallback_ = callback;
  }

  /**
   * @param {number} width visualization width.
   * @param {number} height visualization height.
   */
  setSize(width, height) {
    this.size_.width = width;
    this.size_.height = height;
    this.decodeSize_ = this.size_.clone();
    this.ensureMaxResolutions_();
  }

  /**
   * Set size from clientWidth/Height.
   */
  updateSizeFromClient() {
    let ratio = self.devicePixelRatio || 1;
    // dont do this for performance reasons for now.
    ratio = 1;
    const el = this.getElement();
    this.size_.width = el.clientWidth * ratio;
    this.size_.height = el.clientHeight * ratio;
    this.decodeSize_ = this.size_.clone();
    this.ensureMaxResolutions_();
  }

  /**
   * Max resolution (max dimension) used for visualization. Allows to reduce
   * resolution to hopefully get a higher performance. If set to 0, the full
   * element size is used.
   * @param {number} pixel resolution.
   */
  setMaxVisualizationResolution(pixel) {
    this.maxVisualizationResolution_ = pixel;
    this.ensureMaxResolutions_();
  }

  /**
   * Maximal resolution used for decoding. If set to 0, visualization
   * resolution is used.
   * @param {number} pixel resolution.
   */
  setMaxDecodingResolution(pixel) {
    this.maxDecodeResolution_ = pixel;
    this.ensureMaxResolutions_();
  }

  /**
   * When component is stopped no more screen updates are drawn and no more
   * decoding happens.
   * It does not stop the video stream (use dispose() for that). So you can use this for
   * pausing/resuming scanning.
   * @param {boolean} stopped state.
   */
  setStopped(stopped) {
    stopped = !!stopped;
    const wasStopped = this.stopped_;
    if (stopped === wasStopped)
      return;
    this.stopped_ = stopped;
    if (!stopped) {
      this.scheduleNextFrame();
    } else {
    }
  }

  /**
   * @override
   */
  createDom() {
    const dom = this.getDomHelper();
    this.visualizationCanvas_ = /** @type {!HTMLCanvasElement} */ (
      dom.createDom('canvas'));
    style.setStyle(this.visualizationCanvas_, {'width': '100%', 'height': '100%'});
    this.visualizationContext_ = /** @type {!CanvasRenderingContext2D} */ (
      this.visualizationCanvas_.getContext('2d'));
    // We currently just render the canvas.
    this.setElementInternal(this.visualizationCanvas_);
    this.capturer_.start().then(() => {
      this.onAnimationFrame()
    })
  }

  onAnimationFrame() {
    if (this.stopped_) {
      return;
    }
    this.drawVisualization_();
    this.lastFrameTime_ = Date.now();
    // This draws the result of the last frame on the current frame which
    // is nasty but as we have sent the last image to the worker, we
    // cannot draw it anymore without copying (at least in FF).

    if (!this.isDecoding_) {
      this.worker_.decode(this.capturer_.getVideo(), this.decodeSize_, (type, opt_value) => {
        this.onDecodeMessage_(type, opt_value)
      });
      this.isDecoding_ = true;
    }
    this.scheduleNextFrame();
  }

  /**
   * Scales size if larger than max resolution.
   * @private
   */
  ensureMaxResolutions_() {
    if (this.maxVisualizationResolution_) {
      imgtools.scaleToMaxSize(this.size_, this.maxVisualizationResolution_);
    }
    if (this.maxDecodeResolution_) {
      imgtools.scaleToMaxSize(this.decodeSize_, this.maxDecodeResolution_);
    }
  }

  /**
   * Draws visualization of scanning to canvas.
   * @private
   */
  drawVisualization_() {
    const size = this.size_;
    const canvas = this.visualizationCanvas_;
    // Rescale canvas if needed.
    if (canvas.width != size.width || canvas.height != size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }

    const context = this.visualizationContext_;
    this.capturer_.drawOnCanvas(canvas, context);
    // context.fillStyle = 'rgb(200,0,0)';
    // context.fillText(this.lastResult_, 10, 10);
    const scale = this.size_.width / this.decodeSize_.width;
    const maxAge = this.maxPatternAge_;
    const now = Date.now();
    for (let i = 0; i < this.foundPatterns_.length; ++i) {
      const pattern = this.foundPatterns_[i];
      const age = now - pattern.birthTime;
      if (age >= maxAge) {
        continue;
      }
      const alpha = (maxAge - age) / maxAge;
      const x = pattern.x * scale;
      const y = pattern.y * scale;
      const radius = pattern.size * scale * alpha;
      context.fillStyle = 'rgba(200,255,50,' + alpha + ')';
      context.beginPath();
      context.arc(x, y, radius, 0, 2 * Math.PI, false);
      context.fill();
    }
  }

  /**
   * Request animation frame.
   */
  scheduleNextFrame() {
    const animFrame = (window.requestAnimationFrame ||
      window.mozRequestAnimationFrame || window.oRequestAnimationFrame);
    const timeSinceLastFrame = Date.now() - this.lastFrameTime_;
    let waitTime = 0;
    // Draw at capped FPS
    if (timeSinceLastFrame < this.timeBetweenFrames_) {
      waitTime = this.timeBetweenFrames_ - timeSinceLastFrame;
    }
    let updateFunc = null;
    if (animFrame) {
      updateFunc = () => {
        this.animFrameRequestId_ = animFrame.call(
          window, () => { this.onAnimationFrame() });
      };
    } else {
      updateFunc = () => { this.onAnimationFrame() };
    }
    this.timerRequestId_ = setTimeout(updateFunc, waitTime);
  }

  /**
   * Decoded message from worker.
   * @private
   * @param {string} type from worker.
   * @param {*=} opt_value from worker.
   */
  onDecodeMessage_(type, opt_value) {
    if (this.stopped_) {
      // don't dispatch pending decoding events when stopped.
      this.isDecoding_ = false;
      return;
    }
    switch (type) {
      case WorkerMessageType.DECODED:
        opt_value['patterns'].forEach(this.addPattern_, this);
        this.onDecoded(opt_value['text'], opt_value['format'], opt_value['patterns']);
        this.isDecoding_ = false;
        break;
      case WorkerMessageType.NOTFOUND:
        this.onNotFound();
        this.isDecoding_ = false;
        break;
      case WorkerMessageType.PATTERN:
        this.addPattern_(/** @type {ResultPoint} */ (opt_value));
        break;
    }
  }

  /**
   * Found and decoded barcode.
   * @param {string} text decoded text.
   * @param {!w69b.BarcodeFormat} format barcode format detected.
   * @param {!Array.<!ResultPoint>} result points
   */
  onDecoded(text, format, points) {
    this.decodedCallback_(text, format, points);
  }

  /**
   * No barcode found.
   */
  onNotFound() {
    if (!this.stopped_) {
      this.notFoundCallback_();
    }
  }

  /**
   * @param {!ResultPoint} pattern
   * @private
   */
  addPattern_(pattern) {
    this.foundPatterns_.unshift(new PatternPoint(pattern['x'], pattern['y'],
      pattern['size']));
    const max = 10;
    this.foundPatterns_.splice(max - 1, this.foundPatterns_.length - max);
  }

  /**
   * @override
   */
  enterDocument() {
    super.enterDocument();
    this.updateSizeFromClient();
    this.getHandler().listen(window, events.EventType.RESIZE,
      this.updateSizeFromClient);
    this.getHandler().listen(window, 'orientationchange',
      this.updateSizeFromClient);
  }

  /**
   * @override
   */
  disposeInternal() {
    super.disposeInternal();
    this.stopped_ = true;
    this.capturer_.dispose();
    this.worker_.dispose();
    if (this.animFrameRequestId_) {
      let cancel = (window.cancelAnimationFrame ||
      window.mozCancelRequestAnimationFrame ||
      window.oCancelRequestAnimationFrame);
      if (cancel)
        cancel.call(window, this.animFrameRequestId_);
    }
    if (this.timerRequestId_) {
      clearTimeout(this.timerRequestId_);
    }
  }
}

goog.exportSymbol('w69b.ui.ContinuousScanner', ContinuousScanner);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.isSupported', ContinuousScanner.prototype.isSupported);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.isCapturing', ContinuousScanner.prototype.isCapturing);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.setDecodedCallback', ContinuousScanner.prototype.setDecodedCallback);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.setNotFoundCallback', ContinuousScanner.prototype.setNotFoundCallback);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.setSize', ContinuousScanner.prototype.setSize);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.updateSizeFromClient', ContinuousScanner.prototype.updateSizeFromClient);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.setMaxDecodingResolution', ContinuousScanner.prototype.setMaxDecodingResolution);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.setMaxVisualizationResolution', ContinuousScanner.prototype.setMaxVisualizationResolution);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.setStopped', ContinuousScanner.prototype.setStopped);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.render', ContinuousScanner.prototype.render);
goog.exportSymbol('w69b.ui.ContinuousScanner.prototype.dispose', ContinuousScanner.prototype.dispose);