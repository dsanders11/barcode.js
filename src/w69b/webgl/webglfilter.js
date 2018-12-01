// (c) 2013 Manuel Braun (mb@w69b.com)

goog.provide('w69b.webgl.NotSupportedError');
goog.provide('w69b.webgl.WebGLFilter');
goog.require('goog.debug.Error');
goog.require('w69b.webgl.WebGLProgram');
goog.require('w69b.webgl.shaders.fragCoordTest');


goog.scope(function() {
  const WebGLProgram = w69b.webgl.WebGLProgram;

  /**
   * Thrown when webgl is not supported.
   * @constructor
   * @extends {goog.debug.Error}
   */
  w69b.webgl.NotSupportedError = function() {
    goog.base(this);
  };
  goog.inherits(w69b.webgl.NotSupportedError, goog.debug.Error);
  /** @override */
  w69b.webgl.NotSupportedError.prototype.name = 'NotSupported';

  /**
   * Filters images using webgl shaders.
   * @param {!HTMLCanvasElement=} opt_canvas canvas to use.
   * @constructor
   */
  w69b.webgl.WebGLFilter = function(opt_canvas) {
    this.textures = [];
    /**
     * @private
     * @type {!HTMLCanvasElement}
     */
    this.canvas_ = /** @type {!HTMLCanvasElement} */ (
      opt_canvas || document.createElement('canvas'));
    try {
      this.context_ = /** @type {!WebGLRenderingContext} */ (
        this.canvas_.getContext('webgl') ||
          this.canvas_.getContext('experimental-webgl'));
    } catch (ignored) {
    }
    if (!this.context_)
      throw new w69b.webgl.NotSupportedError();
    w69b.webgl.WebGLFilter.testFragCoordOffset();

    this.framebuffer_ = this.context_.createFramebuffer();
  };
  const _ = w69b.webgl.WebGLFilter;
  /**
   * @type {?Array.<number>}
   * @private
   */
  _.fragCoordOffset_ = null;
  // Simple vertex shader.

  const pro = w69b.webgl.WebGLFilter.prototype;

  /**
   * Rendering context of back canvas.
   * @type {?WebGLRenderingContext}
   * @private
   */
  pro.context_ = null;

  /** @type {!Array.<!WebGLTexture>} */
  pro.textures = [];

  /**
   * @param {number} width canvas width.
   * @param {number} height canvas height.
   */
  pro.setSize = function(width, height) {
    this.canvas_.width = width;
    this.canvas_.height = height;
  };

  /**
   * @return {number} width.
   */
  pro.getWidth = function() {
    return this.canvas_.width;
  };

  /**
   * @return {number} height.
   */
  pro.getHeight = function() {
    return this.canvas_.height;
  };

  /**
   * Set viewport for next rendering call.
   * @param {number} x left offset.
   * @param {number} y bottom offset.
   * @param {number} width size.
   * @param {number} height size.
   */
  pro.setViewport = function(x, y, width, height) {
    this.context_.viewport(x, y, width, height);
  };

  /**
   * Unbind framebuffer.
   */
  pro.unbindFramebuffer = function() {
    var gl = this.context_;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  /**
   * @return {!WebGLRenderingContext} webgl context.
   */
  pro.getContext = function() {
    return /** @type {!WebGLRenderingContext} */(this.context_);
  };

  /**
   * @param {number} id texture id.
   * @return {!WebGLTexture} texture.
   */
  pro.getTexture = function(id) {
    return this.textures[id];
  };

  /**
   * Creates num textures. The first texture is
   * @param {number} num
   */
  pro.createTextures = function(num) {
    var gl = this.context_;
    var width = this.getWidth();
    var height = this.getHeight();

    // Delete current textures first
    for (let texture of this.textures) {
      gl.deleteTexture(texture);
    }

    for (let i = 0; i < num; ++i) {
      this.textures[i] = this.createTexture(i, width, height);
    }
  };

  /**
   * Sets UNPACK_FLIP_Y_WEBGL parameter on given texture.
   * @param {number} id texture id.
   */
  pro.setTextureFlipped = function(id) {
    var gl = this.context_;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[id]);
    // flipped coordinates
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };


  /**
   * Create texture with default parameters.
   * @param {number} id texture unit id.
   * @param {number=} opt_width in pixels.
   * @param {number=} opt_height in pixsels.
   * @return {!WebGLTexture} texture.
   */
  pro.createTexture = function(id, opt_width, opt_height) {
    var gl = this.context_;
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + id);
    //set properties for the texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (opt_width && opt_height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, opt_width, opt_height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

    // gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
  };

  /**
   * Attach texture to framebuffer.
   * @param {number} textureId texture id.
   * @param {!WebGLFramebuffer=} opt_framebuffer defaults to this.framebuffer.
   */
  pro.attachTextureToFB = function(textureId, opt_framebuffer) {
    var gl = this.context_;
    var texture = this.textures[textureId];
    gl.bindFramebuffer(gl.FRAMEBUFFER, opt_framebuffer || this.framebuffer_);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, texture, 0);
  };

  /**
   * Returns offset for normalizing gl_FragCoord.
   * @return {?Array.<number>} offset.
   */
  pro.getFragCoordOffset = function() {
    return _.fragCoordOffset_;
  };

  /**
   * Get image data of canvas.
   * @return {!ImageData} image data.
   */
  pro.getImageData = function() {
    var gl = this.context_;
    var width = this.getWidth();
    var height = this.getHeight();
    var imgdata = new Uint8ClampedArray(4 * width * height);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(imgdata.buffer));
    // TODO - This appears to be upside down, try flipping it over
    return new ImageData(imgdata, width, height);
  };

  /**
   * WebGL implementation supply different offsets for gl_FragCoord to
   * fragment shaders. For the first pixel this can be (0,0), (0.5, 0.5)
   * or (1.0, 1.0). We need to take this into account in our shaders.
   */
  _.testFragCoordOffset = function() {
    if (_.fragCoordOffset_)
      return;
    var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
    var gl = /** @type {!WebGLRenderingContext} */ (
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    canvas.width = 20;
    canvas.height = 20;
    canvas.imageSmoothingEnabled = false;
    var program = new WebGLProgram(gl, w69b.webgl.shaders.fragCoordTest);

    program.use();
    program.initCommonAttributes();

    program.drawRect();
    var imgdata = new Uint8Array(4 * canvas.width * canvas.height);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA,
      gl.UNSIGNED_BYTE, imgdata);

    /**
     * @param {number} val
     * @return {number}
     */
    function round(val) {
      return Math.round(100 * val / 255) / 10;
    }

    var xOffset = imgdata[0];
    var yOffset = imgdata[1];
    // assume 0.1 steps.
    xOffset = round(xOffset);
    yOffset = round(yOffset);
    _.fragCoordOffset_ = [xOffset, yOffset];
    // window.console.log('detected fragment coord offset: (' +
    //   xOffset + ' ' + yOffset + ')');
  };
});
