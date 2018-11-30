// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.ui.Drawable');

goog.scope(function() {
  /**
   * Interface uses to draw qr codes.
   * @interface
   */
  w69b.ui.Drawable = function() { };
  const pro = w69b.ui.Drawable.prototype;

  /**
   * Set size of drawable and fill background.
   * @param {number} width width of drawable in pixels.
   * @param {number} height height of drawable in pixels.
   */
  pro.fillBackground;

  /**
   * Fill rectangle with black color.
   * @param {number} x x pos.
   * @param {number} y y pos.
   * @param {number} width width of rectangle.
   * @param {number} height height of rectangle.
   */
  pro.fillBlack;
});

