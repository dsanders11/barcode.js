// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2013 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
goog.provide('w69b.qr.decoder.QRCodeDecoderMetaData');
goog.require('w69b.ResultPoint');

goog.scope(function() {
  /**
   * Meta-data container for QR Code decoding. Instances of this class may be
   * used to convey information back to the decoding caller. Callers are
   * expected to process this.
   * @constructor
   * @param {boolean} mirrored is the QR code mirrored
   */
  w69b.qr.decoder.QRCodeDecoderMetaData = function(mirrored) {
    this.mirrored = mirrored;
  };
  const QRCodeDecoderMetaData = w69b.qr.decoder.QRCodeDecoderMetaData;
  const pro = QRCodeDecoderMetaData.prototype;

  /**
   * @return {boolean} true if the QR Code was mirrored.
   */
  pro.isMirrored = function() {
    return this.mirrored;
  };

  /**
   * Apply the result points' order correction due to mirroring.
   * @param {!Array.<!w69b.ResultPoint>} points Array of points to apply mirror correction to.
   */
  pro.applyMirroredCorrection = function(points) {
    if (!this.mirrored || points === null || points.length < 3) {
      return;
    }
    const bottomLeft = points[0];
    points[0] = points[2];
    points[2] = bottomLeft;
    // No need to 'fix' top-left and alignment pattern.
  };
});
