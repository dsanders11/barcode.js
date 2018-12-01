// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.ui.LocalVideoCapturer');
goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.math.Size');

goog.scope(function() {
  const Size = goog.math.Size;
  const imgtools = w69b.imgtools;
  /**
   * TODO: add start/stop methods and ready/error events.
   * @constructor
   * @extends {goog.Disposable}
   * @export
   */
  w69b.ui.LocalVideoCapturer = function(constraints) {
    goog.base(this);
    this.backCanvas_ = /** @type {HTMLCanvasElement} */ (
      document.createElement('canvas'));
    this.backCanvas_.style['imageRendering'] = "pixelated";
    this.mediaVideo_ = /** @type {HTMLVideoElement} */ (
      document.createElement('video'));
    this.mediaVideo_.style['imageRendering'] = "pixelated";
    this.mediaVideo_.setAttribute('autoplay', 'true');
    this.backContext_ = /** @type {CanvasRenderingContext2D} */ (
      this.backCanvas_.getContext('2d'));
    this.constraints_ = constraints || { 'facingMode': 'environment' };
  };
  const LocalVideoCapturer = w69b.ui.LocalVideoCapturer;
  goog.inherits(LocalVideoCapturer, goog.Disposable);
  const pro = LocalVideoCapturer.prototype;

  /**
   * Alias to getUserMedia functions.
   * @type {Function}
   */
  LocalVideoCapturer.getMedia = (
    navigator['getUserMedia'] ||
      navigator['webkitGetUserMedia'] ||
      navigator['mozGetUserMedia'] ||
      navigator['msGetUserMedia']);

  if (LocalVideoCapturer.getMedia) {
    LocalVideoCapturer.getMedia =
      LocalVideoCapturer.getMedia.bind(navigator);
  }

  /**
   * @return {boolean} if getUserMedia is supported.
   * @export
   */
  LocalVideoCapturer.isSupported = function() {
    return Boolean(LocalVideoCapturer.getMedia);
  };

  /**
   * Canvas uses to call getImageData on.
   * @type {?HTMLCanvasElement}
   * @private
   */
  pro.backCanvas_ = null;

  /**
   * Rendering context of back canvas.
   * @type {?CanvasRenderingContext2D}
   * @private
   */
  pro.backContext_ = null;

  /**
   * Video element used to render the getUserMedia stream.
   * @type {?HTMLVideoElement}
   * @private
   */
  pro.mediaVideo_ = null;

  /**
   * Constraints to use when calling getUserMedia.
   * @type {?Object}
   * @private
   */
  pro.constraints_ = null;

  /**
   * @type {boolean}
   */
  pro.capturing_ = false;

  /**
   * @type {?MediaStream}
   */
  pro.stream_ = null;

  /**
   * @return {?HTMLVideoElement} video element.
   * @export
   */
  pro.getVideo = function() {
    return this.mediaVideo_;
  };

  /**
   * Start capturing video.
   * @param {function()} ready
   * @export
   */
  pro.start = function(ready) {
    goog.events.listenOnce(this.mediaVideo_, 'canplay', function() {
      this.waitForVideoSize_(ready);
    }, false, this);
    this.getUserMedia();
  };

  /**
   * Is video being captured
   * @return {boolean}
   * @export
   */
  pro.isCapturing = function() {
    return this.capturing_;
  };

  /**
   * Calls ready when videoSize gets greater than 0.
   * Sometimes the video size is 0 in FireFox even after canplay has been
   * triggered. This works arround this by polling the video with.
   * @param {function()} ready
   * @private
   */
  pro.waitForVideoSize_ = function(ready) {
    if (this.mediaVideo_.videoWidth > 0 && this.mediaVideo_.videoHeight > 0) {
      ready();
    } else {
      window.setTimeout(this.waitForVideoSize_.bind(this, ready), 100);
    }
  };

  /**
   * Get Image data of current frame from local video stream.
   * Image is scaled down to opt_maxSize if its width or height is larger.
   * @param {!Size} size desired size of image.
   * @return {!ImageData} image data.
   * @export
   */
  pro.getImageData = function(size) {
    this.drawAndGetCanvas(size);
    return this.backContext_.getImageData(0, 0, size.width, size.height);
  };

  /**
   * Get blob of current frame from local video stream.
   * Image is scaled down to opt_maxSize if its width or height is larger.
   * @param {!Size} size desired size of image.
   * @param {string=} format format to capture
   * @return {!Promise} Resolves to the blob
   * @export
   */
  pro.getBlob = function(size, format = "image/jpeg") {
    this.drawAndGetCanvas(size);
    var backCanvas = this.backCanvas_;
    return new Promise(function(resolve, reject) {
      backCanvas.toBlob(function(blob) {
        resolve(blob);
      }, format);
    });
  };

  /**
   * Get canvas with current frame from local video stream.
   * Image is scaled down to opt_maxSize if its width or height is larger.
   * @param {Size} size desired size of image.
   * @return {HTMLCanvasElement} canvas.
   * @export
   */
  pro.drawAndGetCanvas = function(size) {
    var video = this.mediaVideo_;
    var canvas = this.backCanvas_;
    goog.asserts.assert(video.videoWidth > 0 && video.videoWidth > 0);

    // Rescale canvas if needed.
    if (canvas.width != size.width || canvas.height != size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }
    var context = this.backContext_;
    this.drawOnCanvas(canvas, context);
    return canvas;
  };

  /**
   * Draws video on canvas, scaling to to fit into canvas.
   * @param {!HTMLCanvasElement} canvas canvas to draw on.
   * @param {!CanvasRenderingContext2D} context context of canvas.
   * @export
   */
  pro.drawOnCanvas = function(canvas, context) {
    var video = this.getVideo();
    var width = canvas.width;
    var height = canvas.height;

    // Smallest scale that scales video to desired size.
    var scale = Math.max(height / video.videoHeight, width / video.videoWidth);
    // draw image cropping what does not fit on the right/bottom edges.
    context.imageSmoothingEnabled = false;
    context.drawImage(video, 0, 0,
      video.videoWidth * scale, video.videoHeight * scale);
  };

  /**
   * video stream.
   * @param {!MediaStream} stream
   * @protected
   */
  pro.onGetMediaSuccess = function(stream) {
    // If disposed since, dont do anything.
    if (this.mediaVideo_ === null) {
      return;
    }
    this.mediaVideo_.srcObject = stream;
    this.mediaVideo_.play();
    this.stream_ = stream;
    this.capturing_ = true;
  };

  /**
   * @param {number} code error code
   * @protected
   */
  pro.onGetMediaError = function(code) {
    window.console.log('error code:');
    window.console.log(code);
  };

  /**
   * Starts get user media.
   * @protected
   */
  pro.getUserMedia = function() {
    var self = this;
    LocalVideoCapturer.getMedia({'video': self.constraints_},
      self.onGetMediaSuccess.bind(self),
      self.onGetMediaError.bind(self));
  };

  /**
   * @override
   * @suppress {deprecated}
   */
  pro.disposeInternal = function() {
    this.mediaVideo_.pause();
    this.mediaVideo_.srcObject = null;
    this.capturing_ = false;
    this.mediaVideo_ = null;
    if (this.stream_) {
      if (this.stream_['stop']) {
        this.stream_.stop();
      }
      if (this.stream_['getTracks']) {
        this.stream_['getTracks']().forEach(
          /** @param {MediaStreamTrack} track */
          function(track) {
            track.stop();
          }
        );
      }
    }
  };

  // exports
  goog.exportSymbol('w69b.ui.LocalVideoCapturer.prototype.dispose', pro.dispose);
});
