// (c) 2013 Manuel Braun (mb@w69b.com)

import { MediaStreamVideoCapturer } from './mediastreamvideocapturer.js'

const { assert } = goog.require('goog.asserts');
const Size = goog.require('goog.math.Size');

export class LocalVideoCapturer extends MediaStreamVideoCapturer {
  /**
   * @param {!Object=} constraints 
   */
  constructor(constraints) {
    super();

    /**
     * Constraints to use when calling getUserMedia.
     * @type {!Object}
     * @private
     */
    this.constraints_ = constraints || { facingMode: 'environment' };
  }

  /**
   * @return {boolean} if getUserMedia is supported.
   */
  static isSupported() {
    return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
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
      this.getUserMedia();
    });
  }

  /**
   * Starts get user media.
   * @protected
   */
  async getUserMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        { video: this.constraints_ });
      // If disposed since, dont do anything.
      if (this.mediaVideo_ === null) {
        return;
      }
      this.mediaVideo_.srcObject = stream;
      this.mediaVideo_.play();
      this.stream_ = stream;
      this.capturing_ = true;
    } catch(err) {
      console.error('error:', err);
    }
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
    if (this.stream_) {
      if (this.stream_.stop) {
        this.stream_.stop();
      }
      if (this.stream_.getTracks) {
        for (const track of this.stream_.getTracks()) {
          track.stop();
        }
      }
    }
  }
}

goog.exportSymbol('w69b.ui.LocalVideoCapturer', LocalVideoCapturer);
goog.exportSymbol('w69b.ui.LocalVideoCapturer.prototype.start', LocalVideoCapturer.prototype.start);
goog.exportSymbol('w69b.ui.LocalVideoCapturer.prototype.isCapturing', LocalVideoCapturer.prototype.isCapturing);
goog.exportSymbol('w69b.ui.LocalVideoCapturer.prototype.drawAndGetCanvas', LocalVideoCapturer.prototype.drawAndGetCanvas);
goog.exportSymbol('w69b.ui.LocalVideoCapturer.prototype.drawOnCanvas', LocalVideoCapturer.prototype.drawOnCanvas);
goog.exportSymbol('w69b.ui.LocalVideoCapturer.prototype.dispose', LocalVideoCapturer.prototype.dispose);
