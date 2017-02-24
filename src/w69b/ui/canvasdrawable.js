// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.ui.CanvasDrawable');
goog.require('w69b.ui.Drawable');

goog.scope(function() {
  /**
   * @constructor
   * @param {HTMLCanvasElement} canvas to draw on.
   * @implements {w69b.ui.Drawable}
   * @export
   */
  w69b.ui.CanvasDrawable = function(canvas) {
    this.canvas_ = canvas;
    this.context_ = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.bgStyle_ = 'rgb(255, 255, 255)';
    this.fgStyle_ = 'rgb(0, 0, 0)';
  };
  var pro = w69b.ui.CanvasDrawable.prototype;

  /**
   * @override
   */
  pro.fillBackground = function(width, height) {
    this.canvas_.width = width;
    this.canvas_.height = height;
    this.context_.fillStyle = this.bgStyle_;
    this.context_.fillRect(0, 0, width, height);
  };

  /**
   * @override
   */
  pro.fillBlack = function(x, y, width, height) {
    this.context_.fillStyle = this.fgStyle_;
    this.context_.fillRect(x, y, width, height);
  };
});
