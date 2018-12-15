// (c) 2013 Manuel Braun (mb@w69b.com)

/**
 * Interface uses to draw qr codes.
 * @interface
 */
export class Drawable {
  /**
   * Set size of drawable and fill background.
   * @param {number} width width of drawable in pixels.
   * @param {number} height height of drawable in pixels.
   */
  fillBackground(width, height) {}

  /**
   * Fill rectangle with black color.
   * @param {number} x x pos.
   * @param {number} y y pos.
   * @param {number} width width of rectangle.
   * @param {number} height height of rectangle.
   */
  fillBlack(x, y, width, height) {}
}
