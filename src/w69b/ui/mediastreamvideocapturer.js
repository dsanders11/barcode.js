const Disposable = goog.require('goog.Disposable');
const { assert } = goog.require('goog.asserts');
const Size = goog.require('goog.math.Size');

async function sleep (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export class MediaStreamVideoCapturer extends Disposable {
  /**
   * @param {?MediaStream} stream
   */
  constructor(stream) {
    super();

    /**
     * Canvas uses to call getImageData on.
     * @type {!HTMLCanvasElement}
     * @private
     */
    this.backCanvas_ = document.createElement('canvas');
    this.backCanvas_.style['imageRendering'] = "pixelated";

    /**
     * Rendering context of back canvas.
     * @type {!CanvasRenderingContext2D}
     * @private
     */
    this.backContext_ = this.backCanvas_.getContext('2d');

    /**
     * Video element used to render the getUserMedia stream.
     * @type {!HTMLVideoElement}
     * @private
     */
    this.mediaVideo_ = document.createElement('video');
    this.mediaVideo_.style['imageRendering'] = "pixelated";
    this.mediaVideo_.setAttribute('autoplay', 'true');

    /**
     * @type {boolean}
     */
    this.capturing_ = false;

    /**
     * @type {?MediaStream}
     */
    this.stream_ = stream;
  }

  /**
   * @return {!HTMLVideoElement} video element.
   */
  getVideo() {
    return this.mediaVideo_;
  }

  /**
   * Promise that waits for videoSize to be greater than 0.
   * Sometimes the video size is 0 in FireFox even after canplay has been
   * triggered. This works arround this by polling the video with.
   * @return {!Promise} Resolves to undefined
   * @private
   */
  async waitForVideoSize_() {
    return new Promise(resolve => {
      const video = this.getVideo();

      while (video.videoWidth === 0 || video.videoHeight === 0) {
        sleep(100);
      }

      resolve();
    })
  }

  /**
   * Start capturing video.
   * @return {!Promise} Resolves to undefined
   */
  async start() {
    return new Promise(resolve => {
      this.getVideo().addEventListener('canplay', async () => {
        await this.waitForVideoSize_();
        resolve();
      }, { once: true })
      this.mediaVideo_.srcObject = this.stream_;
      this.mediaVideo_.play();
      this.capturing_ = true;
    });
  }

  /**
   * Is video being captured
   * @return {boolean}
   */
  isCapturing() {
    return this.capturing_;
  }

  /**
   * Get Image data of current frame from local video stream.
   * Image is scaled down to opt_maxSize if its width or height is larger.
   * @param {!Size} size desired size of image.
   * @return {!ImageData} image data.
   */
  getImageData(size) {
    this.drawAndGetCanvas(size);
    return this.backContext_.getImageData(0, 0, size.width, size.height);
  }

  /**
   * Get blob of current frame from local video stream.
   * Image is scaled down to opt_maxSize if its width or height is larger.
   * @param {!Size} size desired size of image.
   * @param {string=} format format to capture
   * @return {!Promise} Resolves to the blob
   */
  getBlob(size, format = "image/jpeg") {
    this.drawAndGetCanvas(size);
    return new Promise(resolve => {
      this.backCanvas_.toBlob(blob => {
        resolve(blob);
      }, format);
    });
  }

  /**
   * Get canvas with current frame from local video stream.
   * Image is scaled down to opt_maxSize if its width or height is larger.
   * @param {!Size} size desired size of image.
   * @return {!HTMLCanvasElement} canvas.
   */
  drawAndGetCanvas(size) {
    const video = this.getVideo();
    const canvas = this.backCanvas_;
    assert(video.videoWidth > 0 && video.videoWidth > 0);

    // Rescale canvas if needed.
    if (canvas.width != size.width || canvas.height != size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }
    const context = this.backContext_;
    this.drawOnCanvas(canvas, context);
    return canvas;
  }

  /**
   * Draws video on canvas, scaling to to fit into canvas.
   * @param {!HTMLCanvasElement} canvas canvas to draw on.
   * @param {!CanvasRenderingContext2D} context context of canvas.
   */
  drawOnCanvas(canvas, context) {
    const video = this.getVideo();
    const width = canvas.width;
    const height = canvas.height;

    // Smallest scale that scales video to desired size.
    const scale = Math.max(height / video.videoHeight, width / video.videoWidth);
    // draw image cropping what does not fit on the right/bottom edges.
    context.imageSmoothingEnabled = false;
    context.drawImage(video, 0, 0,
      video.videoWidth * scale, video.videoHeight * scale);
  }

  /**
   * @override
   * @suppress {deprecated}
   */
  disposeInternal() {
    this.mediaVideo_.pause();
    this.mediaVideo_.srcObject = null;
    this.capturing_ = false;
    this.mediaVideo_ = null;
  }
}

goog.exportSymbol('w69b.ui.MediaStreamVideoCapturer', MediaStreamVideoCapturer);
goog.exportSymbol('w69b.ui.MediaStreamVideoCapturer.prototype.start', MediaStreamVideoCapturer.prototype.start);
goog.exportSymbol('w69b.ui.MediaStreamVideoCapturer.prototype.isCapturing', MediaStreamVideoCapturer.prototype.isCapturing);
goog.exportSymbol('w69b.ui.MediaStreamVideoCapturer.prototype.drawAndGetCanvas', MediaStreamVideoCapturer.prototype.drawAndGetCanvas);
goog.exportSymbol('w69b.ui.MediaStreamVideoCapturer.prototype.drawOnCanvas', MediaStreamVideoCapturer.prototype.drawOnCanvas);
goog.exportSymbol('w69b.ui.MediaStreamVideoCapturer.prototype.dispose', MediaStreamVideoCapturer.prototype.dispose);