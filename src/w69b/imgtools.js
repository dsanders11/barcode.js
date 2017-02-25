// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.imgtools');
goog.require('goog.asserts');
goog.require('goog.crypt.base64');
goog.require('goog.math.Size');
goog.require('w69b.ImageDataLuminanceSource');
goog.require('w69b.ImageSource');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.common.HybridBinarizer');
goog.require('w69b.exceptions.UnsupportedOperationException');
goog.require('w69b.ui.Drawable');
goog.require('w69b.webgl.WebGLBinarizer');


goog.scope(function() {
  var Size = goog.math.Size;
  var base64 = goog.crypt.base64;
  var ImageDataLuminanceSource = w69b.ImageDataLuminanceSource;
  var UnsupportedOperationException = w69b.exceptions.UnsupportedOperationException;
  var WebGLBinarizer = w69b.webgl.WebGLBinarizer;

  /**
   * Get content of canvas as png stored in a blob.
   * @param {HTMLCanvasElement} canvas canvas element.
   * @param {function(Blob)} callback called with blob data.
   * @export
   */
  w69b.imgtools.getCanvasAsBlob = function(canvas, callback) {
    if (canvas['toBlob']) {
      // toBlob supported
      canvas['toBlob'](callback);
    } else if (canvas.toDataURL) {
      var url = canvas.toDataURL();
      var prefix = 'data:image/png;base64,';
      if (!goog.string.startsWith(url, prefix))
        throw Error();
      var data = url.substring(prefix.length);
      data = new Uint8Array(base64.decodeStringToByteArray(data));
      var blob = new Blob([data], {'type': 'image/png'});
      callback(blob);
    } else {
      throw Error();
    }
  };

  /**
   * Get Image data of given Image object. Same origin policy applies to
   * image src. Image has to be loaded. Image is scaled down to opt_maxSize if
   * its width or height is larger. Will be grayscaled if browser supports it.
   * @param {!w69b.ImageSource} img image.
   * @param {(number|Size)=} opt_maxSize max size of any dimension in pixels or Size object
   * that img data should cover (cropping bottom-right corners).
   * @return {!ImageData} image data.
   */
  w69b.imgtools.getImageData = function(img, opt_maxSize) {
    var size = new Size(
      /** @type {number} */ (img.width || img.videoWidth),
      /** @type {number} */ (img.height || img.videoHeight));

    goog.asserts.assert(size.width > 0 && size.height > 0);
    var canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    canvas.style = "image-rendering: pixelated";
    if (opt_maxSize) {
      w69b.imgtools.scaleToMaxSize(size, opt_maxSize);
//      if (goog.isNumber(opt_maxSize)) {
//        opt_maxSize = new Size(opt_maxSize, opt_maxSize);
//        if (!size.fitsInside(opt_maxSize))
//          size = size.scaleToFit(opt_maxSize);
//      } else {
//        if (!size.fitsInside(opt_maxSize))
//          size = size.scaleToCover(opt_maxSize);
//      }
//      size.floor();
    }
    canvas.width = size.width;
    canvas.height = size.height;
    var context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    var canvasFiltersSupported = Boolean(context.filter);
    if (canvasFiltersSupported) {
      var svgHolder = document.createElement('div');
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
      context.filter = 'url(#grayscale)';
    }
    context.imageSmoothingEnabled = false;
    context.drawImage(img, 0, 0, size.width, size.height);
    var imageData = context.getImageData(0, 0, size.width, size.height);
    canvas.remove();
    if (canvasFiltersSupported) {
      svgHolder.remove();
      imageData.grayscale_ = true;
    }
    return imageData;
  };

  /** @type {Object<string, WebGLBinarizer>} cache of WebGLBinarizer */
  w69b.imgtools.binarizerCache_ = {};

  /**
   * @param {!(w69b.ImageSource|ImageData)} image image to binarize.
   * @param {boolean=} useWebGL should WebGL be used to binarize.
   * @param {(number|Size)=} opt_maxSize max size of any dimension in pixels or
   *                                     Size object that img data should cover
   *                                     (cropping bottom-right corners).
   * @return {!ImageData} binary data.
   * @export
   */
  w69b.imgtools.binarizeImage = function(image, useWebGL = false, opt_maxSize) {
    if (!(image instanceof ImageData)) {
      image.style = "image-rendering: pixelated";
    }
    var imageData = image;
    if (useWebGL) {
      if (!WebGLBinarizer.isSupported()) {
        throw new UnsupportedOperationException("WebGL not supported");
      }
      let width = /** @type {number} */ (image.width || image.videoWidth);
      let height = /** @type {number} */ (image.height || image.videoHeight);
      let size = new Size(width, height);
      if (opt_maxSize) {
        w69b.imgtools.scaleToMaxSize(size, opt_maxSize);
      }
      let binarizerArgs = [size.width, size.height, width, height];
      let cacheKey = JSON.stringify(binarizerArgs);
      let binarizer = w69b.imgtools.binarizerCache_[cacheKey];
      if (!binarizer) {
        binarizer = new WebGLBinarizer();
        binarizer.setup(...binarizerArgs);
        w69b.imgtools.binarizerCache_[cacheKey] = binarizer;
      }
      binarizer.render(imageData);
      return binarizer.getImageData();
    } else {
      if (!(imageData instanceof ImageData)) {
        imageData = w69b.imgtools.getImageData(imageData, opt_maxSize);
      }
      let luminanceSource = new ImageDataLuminanceSource(imageData);
      let binarizer = new w69b.common.HybridBinarizer(luminanceSource);
      let matrix = binarizer.getBlackMatrix();
      let width = matrix.getWidth();
      let height = matrix.getHeight();
      let data = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let idx = (y * width + x) * 4;
          let val = matrix.get(x, y) ? 0 : 255;
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return new ImageData(data, width, height);
    }
  };

  /**
   * @param {!w69b.common.BitMatrix} matrix the matrix to render
   * @param {!w69b.ui.Drawable} drawable the drawable to render onto
   * @export
   */
  w69b.imgtools.renderToDrawable = function(matrix, drawable) {
    var width = matrix.getWidth();
    var height = matrix.getHeight();
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
   * @param {!(number|Size)} maxSize
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
