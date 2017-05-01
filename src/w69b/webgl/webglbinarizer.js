// (c) 2013 Manuel Braun (mb@w69b.com)

goog.provide('w69b.webgl.WebGLBinarizer');
goog.require('goog.math.Size');
goog.require('w69b.ImageSource');
goog.require('w69b.webgl.WebGLFilter');
goog.require('w69b.webgl.WebGLParams');
goog.require('w69b.webgl.WebGLPipeline');
goog.require('w69b.webgl.WebGLProgram');
goog.require('w69b.webgl.shaders.binarizeAvg1');
goog.require('w69b.webgl.shaders.binarizeGroup');
goog.require('w69b.webgl.shaders.estimateBlack');
goog.require('w69b.webgl.shaders.gaussBlur');


goog.scope(function() {
  var WebGLFilter = w69b.webgl.WebGLFilter;
  var WebGLProgram = w69b.webgl.WebGLProgram;
  var WebGLParams = w69b.webgl.WebGLParams;
  var WebGLPipeline = w69b.webgl.WebGLPipeline;
  /**
   * WebGL shader based image binarizer.
   * The basic idea is to estimate an average black level for each pixel by looking at
   * neighbouring pixels, while choosing the neighbourhood large enough to cover a sufficently
   * large dynamic range.
   * Then simply apply thresholding based on that value.
   *
   * In detail:
   * - Successively apply shaders to compute a scale space and the dynamic range
   * (gaussBlur, binarizeAvg1, binarizeGroup).
   * - Run estimateBlack shader to pick a gray level estimation. It just chooses the
   * gray level from the smallest scale that still satisfies a dynamic range constraint.
   * - Run thresholding shader to apply thresholding on input image gray values with
   * black level estimations.
   *
   * @constructor
   * @param {HTMLCanvasElement=} opt_canvas canvas to use.
   */
  w69b.webgl.WebGLBinarizer = function(opt_canvas) {
    this.filter_ = new WebGLFilter(opt_canvas);
  };
  var pro = w69b.webgl.WebGLBinarizer.prototype;
  var _ = w69b.webgl.WebGLBinarizer;
  /**
   * @type {?boolean}
   */
  _.isSupported_ = null;

  pro.pipeline_ = null;
  pro.setupCalled_ = false;
  /**
   * If canvas is displayed directly, input data needs to be flipped around
   * y axis.
   * @type {boolean}
   * @private
   */
  pro.flipInput_ = false;


  /**
   * Size of native input image/video.
   * @type {?goog.math.Size}
   * @private
   */
  pro.inSize_ = null;

  /** @type {WebGLProgram} */
  pro.programDynRange1 = null;

  /** @type {WebGLProgram} */
  pro.programDynRange2 = null;

  /** @type {WebGLProgram} */
  pro.programEstimateBlack = null;

  /** @type {WebGLProgram} */
  pro.programThreshold = null;

  /** @type {WebGLProgram} */
  pro.programGauss = null;

  /**
   * @param {string} source fragment source.
   * @return {WebGLProgram} compiled program.
   */
  pro.getProgram = function(source) {
    return new WebGLProgram(this.filter_.getContext(), source);
  };

  /**
   * @param {boolean} flip whether to flip input arround y axis.
   */
  pro.setFlipInput = function(flip) {
    this.flipInput_ = flip;
  };

  /**
   * Setup binarizer for given image dimensions.
   * Only call this once.
   * @param {number} width in pixels.
   * @param {number} height in pixels.
   * @param {number=} opt_inWidth in pixels.
   * @param {number=} opt_inHeight in pixels.
   */
  pro.setup = function(width, height, opt_inWidth, opt_inHeight) {
    if (!opt_inHeight)
      opt_inHeight = height;
    if (!opt_inWidth)
      opt_inWidth = width;
    if (!this.setupCalled_) {
      // compile shaders
      this.programDynRange1 = this.getProgram(w69b.webgl.shaders.binarizeAvg1);
      this.programDynRange2 = this.getProgram(w69b.webgl.shaders.binarizeGroup);
      this.programEstimateBlack = this.getProgram(w69b.webgl.shaders.estimateBlack);
      this.programThreshold = this.getProgram(w69b.webgl.shaders.threshold);
      this.programGauss = this.getProgram(w69b.webgl.shaders.gaussBlur);
    }

    if (!this.setupCalled_ ||
      this.filter_.getWidth() != width ||
      this.filter_.getHeight() != height ||
      this.inSize_.width != opt_inWidth ||
      this.inSize_.height != opt_inHeight) {
      this.filter_.setSize(width, height);
      this.inSize_ = new goog.math.Size(opt_inWidth, opt_inHeight);
      this.filter_.createTextures(3);
      if (this.flipInput_)
        this.filter_.setTextureFlipped(0);
      this.pipeline_ = this.createPipeline();
    }
    this.setupCalled_ = true;
  };

  /**
   * @return {WebGLPipeline}
   */
  pro.createPipeline = function() {
    var width = this.filter_.getWidth();
    var height = this.filter_.getHeight();
    var inSize = this.inSize_;

    var pipeline = new WebGLPipeline(this.filter_);
    // Some shaders that are useful for debugging.
    // var grayscale = new WebGLProgram(gl, w69b.webgl.shaders.grayscale);
    // var dummy = this.getProgram(w69b.webgl.shaders.dummy);
    // var extractChannel = this.getProgram(w69b.webgl.shaders.extractChannel);
    // var debug = new WebGLProgram(gl, w69b.webgl.shaders.debug);
    var baseParams = new WebGLParams(
      {
        'width': width,
        'height': height,
        'inwidth': width,
        'inheight': height,
        'texwidth': width,
        'texheight': height,
        'inOffset': [0, 0],
        'outOffset': [0, 0],
        'fragCoordOffset': this.filter_.getFragCoordOffset()
      });
    var downScalePower = 3;
    var scaledWith = Math.max(1, width >> downScalePower);
    var scaledHeight = Math.max(1, height >> downScalePower);
    var smallImgParams = baseParams.clone().set({
      'width': scaledWith,
      'height': scaledHeight,
      'inwidth': scaledWith,
      'inheight': scaledHeight
    });

    // Apply gauss and downsample to scaledWidth/Height
    pipeline.addPass(this.programGauss,
      baseParams.clone().set({
        'width': scaledWith,
        'sampleDirection': [0, 1],
        'texwidth': inSize.width,
        'texheight': inSize.height
      }));

    pipeline.addPass(this.programGauss,
      smallImgParams.clone().set({
        'inheight': height,
        'sampleDirection': [1, 0]
      }));

    // Compute more dynamic ranges and two more scales on gray
    // level image, in a layout next to each other. Kernel size increases
    // from left to right.
    pipeline.addPass(this.programDynRange1, smallImgParams.clone().set({
      'sampleDirection': [0, 1]
    }));
    pipeline.addPass(this.programDynRange2, smallImgParams.clone().set({
      'sampleDirection': [1, 0]
    }));

    pipeline.addPass(this.programDynRange2, smallImgParams.clone().set({
      'sampleDirection': [0, 2]
    }));
    pipeline.addPass(this.programDynRange2, smallImgParams.clone().set({
      'sampleDirection': [2, 0],
      'outOffset': [scaledWith, 0]
    }));

    pipeline.addPass(this.programDynRange2, smallImgParams.clone().set({
      'sampleDirection': [0, 2],
      'inOffset': [scaledWith, 0]
    }));
    pipeline.addPass(this.programDynRange2, smallImgParams.clone().set({
      'sampleDirection': [2, 0],
      'outOffset': [scaledWith * 2, 0]
    }));
    // Use scale space and dynamic range estimations to estimate black level.
    pipeline.addPass(this.programEstimateBlack, smallImgParams);
    // pipeline.addPass(extractChannel,
    //  smallImgParams.clone().setInt('channel', 2));

    pipeline.addPass(this.programThreshold, smallImgParams.clone()
      .setInt('origImage', 0)
      .set({
        'width': inSize.width, 'height': inSize.height,
        'inwidth': scaledWith, 'inheight': scaledHeight
      }));
    return pipeline;
  };

  /**
   * @return {!ImageData} image data.
   */
  pro.getImageData = function() {
    return this.filter_.getImageData();
  };

  /**
   * @param {!(w69b.ImageSource|ImageData)} image image
   * to render.
   */
  pro.render = function(image) {
    if (!this.setupCalled_) {
      throw new Error();
    }
    var gl = this.filter_.getContext();
    // bind input image to texture 0.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.filter_.getTexture(0));
    if (image instanceof ImageData) {
      // custom image data
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(image.data.buffer));

    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        image);
    }

    this.pipeline_.render(0, 1, 2, true);
  };

  /**
   * @param {number} width in pixels.
   * @param {number} height in pixels.
   * @return {!ImageData} test image.
   */
  _.createSupportCheckImage = function(width, height) {
    var imgdata = new Uint8ClampedArray(4 * width * height);
    // build gradient
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        let pos = 4 * (width * y + x);
        let gray = x;
        imgdata[pos] = gray;
        imgdata[pos + 1] = gray;
        imgdata[pos + 2] = gray;
        imgdata[pos + 3] = 255;
      }
    }
    return new ImageData(imgdata, width, height);
  };

  /**
   * @return {boolean}
   */
  _.isSupported = function() {
    // create test image
    if (_.isSupported_ === null) {
      let binarizer = null;
      let width = 100;
      let height = 20;
      let img = _.createSupportCheckImage(width, height);
      // set contrast on some pixels.
      setPixelGray(img, 30, 4, 18);
      setPixelGray(img, 90, 4, 50);
      try {
        binarizer = new w69b.webgl.WebGLBinarizer();
        binarizer.setFlipInput(false);
        binarizer.setup(width, height);
        binarizer.render(new ImageData(img.data, width, height));
      } catch (err) {
        console.debug('No webgl binarizer support:', err);
        _.isSupported_ = false;
        return false;
      }
      let binary = binarizer.getImageData();
      // Check some black and white values.
      _.isSupported_ = (getPixel(binary, 30, 4)[0] == 0 &&
      getPixel(binary, 90, 4)[0] == 0 &&
      getPixel(binary, 31, 4)[0] == 255 &&
      getPixel(binary, 29, 4)[0] == 255);
    }
    return _.isSupported_;
  };

  /**
   * @param {!ImageData} imageData
   * @param {number} x
   * @param {number} y
   * @param {number} gray
   */
  function setPixelGray(imageData, x, y, gray) {
    var data = imageData.data;
    var pos = 4 * (y * imageData.width + x);
    data[pos] = gray;
    data[pos + 1] = gray;
    data[pos + 2] = gray;
    data[pos + 3] = 255;
  }

  /**
   * @param {!ImageData} imageData
   * @param {number} x pos.
   * @param {number} y pos.
   * @return {Array.<number>} [red, green, blue, alpha] values.
   */
  function getPixel(imageData, x, y) {
    var data = imageData.data;
    var pos = 4 * (y * imageData.width + x);
    return [data[pos], data[pos + 1], data[pos + 2], data[pos + 3]];
  }
});
