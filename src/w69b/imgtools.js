// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.imgtools');
goog.require('goog.asserts');
goog.require('goog.crypt.base64');
goog.require('goog.math.Size');
goog.require('w69b.ImageDataLuminanceSource');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.common.HybridBinarizer');
goog.require('w69b.ui.Drawable');
goog.require('w69b.webgl.WebGLBinarizer');


goog.scope(function() {
  const Size = goog.math.Size;
  const base64 = goog.crypt.base64;
  const ImageDataLuminanceSource = w69b.ImageDataLuminanceSource;
  const WebGLBinarizer = w69b.webgl.WebGLBinarizer;

  const _ = w69b.imgtools;

  /** @type {?HTMLCanvasElement} */
  _.canvas_ = null;

  /** @type {?CanvasRenderingContext2D} */
  _.context_ = null;

  /**
   * @return {!Array}
   */
  function getOrCreateCanvas_() {
    if (_.canvas_ === null) {
      _.canvas_ = document.createElement('canvas');
      _.canvas_.style['imageRendering'] = "pixelated";
      _.context_ = _.canvas_.getContext('2d');
      if (_.context_.filter) {
        let svgHolder = document.createElement('div');
        svgHolder.style['display'] = "none";
        svgHolder.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg"
               xmlns:xlink="http://www.w3.org/1999/xlink"
               viewBox="0 0 204 224">
            <defs>
              <filter id="grayscale">
                <feColorMatrix type="matrix"values="0.25 0.5 0.25 0 0
                                                    0.25 0.5 0.25 0 0
                                                    0.25 0.5 0.25 0 0
                                                    0 0 0 0 1"/>
              </filter>
            </defs>
          </svg>`;
        document.body.appendChild(svgHolder);
        _.context_.filter = 'url(#grayscale)';
      }
      _.context_.imageSmoothingEnabled = false;
    }

    return [_.canvas_, _.context_];
  }

  /**
   * Get content of canvas as png stored in a blob.
   * @param {!HTMLCanvasElement} canvas canvas element.
   * @param {function(!Blob)} callback called with blob data.
   * @export
   */
  w69b.imgtools.getCanvasAsBlob = function(canvas, callback) {
    if (canvas['toBlob']) {
      // toBlob supported
      canvas['toBlob'](callback);
    } else if (canvas.toDataURL) {
      const url = canvas.toDataURL();
      const prefix = 'data:image/png;base64,';
      if (!goog.string.startsWith(url, prefix))
        throw new Error();
      let data = url.substring(prefix.length);
      data = new Uint8Array(base64.decodeStringToByteArray(data));
      const blob = new Blob([data], {'type': 'image/png'});
      callback(blob);
    } else {
      throw new Error();
    }
  };

  /**
   * Get Image data of given Image object. Same origin policy applies to
   * image src. Image has to be loaded. Image is scaled down to opt_maxSize if
   * its width or height is larger. Will be grayscaled if browser supports it.
   * @param {!CanvasImageSource} img image.
   * @param {(number|!Size)=} opt_maxSize max size of any dimension in pixels or Size object
   * that img data should cover (cropping bottom-right corners).
   * @return {!ImageData} image data.
   */
  w69b.imgtools.getImageData = function(img, opt_maxSize) {
    const size = new Size(
      /** @type {number} */ (img.width || img.videoWidth),
      /** @type {number} */ (img.height || img.videoHeight));

    goog.asserts.assert(size.width > 0 && size.height > 0);
    if (opt_maxSize) {
      w69b.imgtools.scaleToMaxSize(size, opt_maxSize);
    }
    const [canvas, context] = getOrCreateCanvas_();
    canvas.width = size.width;
    canvas.height = size.height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    if (context.filter) {
      imageData.grayscale_ = true;
    }
    return imageData;
  };

  /**
   * @param {!CanvasImageSource|!ImageData} image image to binarize.
   * @param {boolean=} useWebGL should WebGL be used to binarize.
   * @param {(number|!Size)=} opt_maxSize max size of any dimension in pixels or
   *                                      Size object that img data should cover
   *                                      (cropping bottom-right corners).
   * @return {!ImageData} binary data.
   * @export
   */
  w69b.imgtools.binarizeImage = function() {
    let webGLBinarizer = null;

    return function(image, useWebGL = false, opt_maxSize) {
      if (!(image instanceof ImageData)) {
        image.style['imageRendering'] = "pixelated";
      }
      let imageData = image;
      if (useWebGL) {
        if (!WebGLBinarizer.isSupported()) {
          throw new Error("WebGL not supported");
        }
        const width = /** @type {number} */ (image.width || image.videoWidth);
        const height = /** @type {number} */ (image.height || image.videoHeight);
        const size = new Size(width, height);
        if (opt_maxSize) {
          w69b.imgtools.scaleToMaxSize(size, opt_maxSize);
        }
        if (webGLBinarizer === null) {
          webGLBinarizer = new WebGLBinarizer();
        }
        const binarizer = webGLBinarizer;
        binarizer.setup(size.width, size.height, width, height);
        binarizer.render(imageData);
        return binarizer.getImageData();
      } else {
        if (!(imageData instanceof ImageData)) {
          imageData = w69b.imgtools.getImageData(imageData, opt_maxSize);
        }
        const luminanceSource = new ImageDataLuminanceSource(imageData);
        const binarizer = new w69b.common.HybridBinarizer(luminanceSource);
        const matrix = binarizer.getBlackMatrix();
        const width = matrix.getWidth();
        const height = matrix.getHeight();
        const data = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const val = matrix.get(x, y) ? 0 : 255;
            data[idx] = val;
            data[idx + 1] = val;
            data[idx + 2] = val;
            data[idx + 3] = 255;
          }
        }
        return new ImageData(data, width, height);
      }
    };
  }();

  /**
   * @param {!w69b.common.BitMatrix} matrix the matrix to render
   * @param {!w69b.ui.Drawable} drawable the drawable to render onto
   * @export
   */
  w69b.imgtools.renderToDrawable = function(matrix, drawable) {
    const width = matrix.getWidth();
    const height = matrix.getHeight();
    drawable.fillBackground(width, height);
    for (let x=0; x < width; x++) {
      for (let y=0; y < height; y++) {
        if (matrix.get(x, y) === true) {
          drawable.fillBlack(x, y, 1, 1);
        }
      }
    }
  };

  /**
   * Scales size in-place to fit maxSize if larger, keeping the aspect ratio.
   * @param {!Size} size
   * @param {number|!Size} maxSize
   * @export
   */
  w69b.imgtools.scaleToMaxSize = function(size, maxSize) {
    if (goog.isNumber(maxSize)) {
      maxSize = new Size(maxSize, maxSize);
      if (!size.fitsInside(maxSize)) {
        size = size.scaleToFit(maxSize);
      }
    } else {
      if (!size.fitsInside(maxSize)) {
        size = size.scaleToCover(maxSize);
      }
    }
    size.floor();
  };

});
