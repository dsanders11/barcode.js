// (c) 2013 Manuel Braun (mb@w69b.com)

// import { BitMatrix } from '/w69b/common/bitmatrix.mjs';
import { Drawable } from '/w69b/ui/drawable.js';
import { HybridBinarizer } from '/w69b/common/hybridbinarizer.mjs';

const ImageDataLuminanceSource = goog.require('w69b.ImageDataLuminanceSource');
const Size = goog.require('goog.math.Size');
const WebGLBinarizer = goog.require('w69b.webgl.WebGLBinarizer');
const base64 = goog.require('goog.crypt.base64');
const { assert } = goog.require('goog.asserts');

/** @type {?HTMLCanvasElement} */
let canvas_ = null;

/** @type {?CanvasRenderingContext2D} */
let context_ = null;

/** @type {?w69b.webgl.WebGLBinarizer} */
let webGLBinarizer = null;

/**
 * @return {!Array}
 */
function getOrCreateCanvas_() {
  if (canvas_ === null) {
    canvas_ = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
    canvas_.style['imageRendering'] = "pixelated";
    context_ = /** @type {!CanvasRenderingContext2D} */ (canvas_.getContext('2d'));
    if (context_.filter) {
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
      context_.filter = 'url(#grayscale)';
    }
    context_.imageSmoothingEnabled = false;
  }

  return [canvas_, context_];
}

/**
 * Get content of canvas as png stored in a blob.
 * @param {!HTMLCanvasElement} canvas canvas element.
 * @param {function(!Blob)} callback called with blob data.
 */
export function getCanvasAsBlob(canvas, callback) {
  if (canvas.toBlob) {
    // toBlob supported
    canvas.toBlob(callback);
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
}

/**
 * Get Image data of given Image object. Same origin policy applies to
 * image src. Image has to be loaded. Image is scaled down to opt_maxSize if
 * its width or height is larger. Will be grayscaled if browser supports it.
 * @param {!CanvasImageSource} img image.
 * @param {(number|!Size)=} opt_maxSize max size of any dimension in pixels or Size object
 * that img data should cover (cropping bottom-right corners).
 * @return {!ImageData} image data.
 */
export function getImageData(img, opt_maxSize) {
  const size = new Size(
    /** @type {number} */ (img.width || img.videoWidth),
    /** @type {number} */ (img.height || img.videoHeight));

  assert(size.width > 0 && size.height > 0);
  if (opt_maxSize) {
    scaleToMaxSize(size, opt_maxSize);
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
}

/**
 * @param {!CanvasImageSource|!ImageData} image image to binarize.
 * @param {boolean=} useWebGL should WebGL be used to binarize.
 * @param {(number|!Size)=} opt_maxSize max size of any dimension in pixels or
 *                                      Size object that img data should cover
 *                                      (cropping bottom-right corners).
 * @return {!ImageData} binary data.
 */
export function binarizeImage(image, useWebGL = false, opt_maxSize) {
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
      scaleToMaxSize(size, opt_maxSize);
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
      imageData = getImageData(imageData, opt_maxSize);
    }
    const luminanceSource = new ImageDataLuminanceSource(imageData);
    const binarizer = new HybridBinarizer(luminanceSource);
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
}

/**
 * @param {!w69b.common.BitMatrix} matrix the matrix to render
 * @param {!Drawable} drawable the drawable to render onto
 */
export function renderToDrawable(matrix, drawable) {
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
}

/**
 * Scales size in-place to fit maxSize if larger, keeping the aspect ratio.
 * @param {!Size} size
 * @param {number|!Size} maxSize
 */
export function scaleToMaxSize(size, maxSize) {
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
}

goog.exportSymbol('w69b.imgtools.getCanvasAsBlob', getCanvasAsBlob);
goog.exportSymbol('w69b.imgtools.getImageData', getImageData);
goog.exportSymbol('w69b.imgtools.binarizeImage', binarizeImage);
goog.exportSymbol('w69b.imgtools.renderToDrawable', renderToDrawable);
goog.exportSymbol('w69b.imgtools.scaleToMaxSize', scaleToMaxSize);
