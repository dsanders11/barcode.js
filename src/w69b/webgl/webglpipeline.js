// (c) 2013 Manuel Braun (mb@w69b.com)

goog.provide('w69b.webgl.WebGLPipeline');
goog.require('w69b.webgl.WebGLParams');
goog.require('w69b.webgl.WebGLProgram');

goog.scope(function() {
  const WebGLParams = w69b.webgl.WebGLParams;
  const WebGLProgram = w69b.webgl.WebGLProgram;

  /**
   * Helps to execute multipass webgl programms by applying multiple programs
   * and parameter successively.
   * @param {w69b.webgl.WebGLFilter} filter webgl filter.
   * @constructor
   */
  w69b.webgl.WebGLPipeline = function(filter) {
    /** @type {(function(number, number, number)|Array.<(WebGLProgram|WebGLParams)>)}*/
    this.passes_ = [];
    this.filter_ = filter;
  };
  const pro = w69b.webgl.WebGLPipeline.prototype;

  /**
   *
   * @param {WebGLProgram} program to run.
   * @param {WebGLParams} parameters to apply.
   */
  pro.addPass = function(program, parameters) {
    this.passes_.push([program, parameters]);
  };

  /**
   * Add custom pass.
   * @param {function(number, number, number)} callback that takes three
   * paramters:
   * - input texture id.
   * - out texture id
   * - working texture id (for intermediate results).
   */
  pro.addCustomPass = function(callback) {
    this.passes_.push(callback);
  };

  /**
   * @param {number} inTextureId
   * @param {number} outTextureId
   * @param {number} workTextureId
   * @param {boolean=} opt_resultOnScreen
   */
  pro.render = function(inTextureId, outTextureId, workTextureId,
                        opt_resultOnScreen) {
    var prevProgarm = null;
    var filter = this.filter_;
    var numPasses = this.passes_.length;
    /** @type {Array.<number>} */
    var pingPongTextureIds;
    // Ensures last pass goes on outTextureId.
    if (numPasses % 2 == 0) {
      pingPongTextureIds = [workTextureId, outTextureId];
    } else {
      pingPongTextureIds = [outTextureId, workTextureId];
    }

    var prevTextureId = inTextureId;
    for (let i = 0; i < numPasses; ++i) {
      let pass = this.passes_[i];
      if (pass.length) {
        let program = /** @type {WebGLProgram} */ (pass[0]);
        let params = /** @type {WebGLParams} */ (pass[1]);
        if (program != prevProgarm) {
          program.use();
          program.initCommonAttributes();
          prevProgarm = program;
        }
        program.setUniform1i('imageIn', prevTextureId);
        params.apply(program);
        if (i == numPasses - 1 && opt_resultOnScreen) {
          filter.unbindFramebuffer();
        } else {
          let texId = pingPongTextureIds[i % 2];
          filter.attachTextureToFB(texId);
          prevTextureId = texId;
        }
        let offset = params.getValue('outOffset');
        filter.setViewport(
          offset ? offset[0] : 0,
          offset ? offset[1] : 0,
          params.getValue('width'),
          params.getValue('height'));
        program.drawRect();
      } else {
        // custom pass
        let outTex = pingPongTextureIds[i % 2];
        let workTex = pingPongTextureIds[(i + 1) % 2];
        pass(prevTextureId, outTex, workTex);
        prevTextureId = outTex;
      }
    }
  };
});
