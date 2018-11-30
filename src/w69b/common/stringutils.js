// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.common.stringutils');
goog.require('w69b.DecodeHintType');
goog.require('w69b.InvalidCharsetException');
goog.require('w69b.iconvlite');
goog.require('w69b.utf8');

goog.scope(function() {
  const _ = w69b.common.stringutils;
  const utf8 = w69b.utf8;
  const iconv = self.iconv;
  const iconvlite = w69b.iconvlite;
  const DecodeHintType = w69b.DecodeHintType;
  const InvalidCharsetException = w69b.InvalidCharsetException;

  _.SHIFT_JIS = 'Shift_JIS';
  _.GB2312 = 'GB18030';
  _.EUC_JP = 'EUC-JP';
  _.UTF8 = 'UTF-8';
  _.ISO88591 = 'ISO-8859-1';
  _.PLATFORM_DEFAULT_ENCODING = _.UTF8;
  _.ASSUME_SHIFT_JIS = false;
  // SHIFT_JIS.equalsIgnoreCase(PLATFORM_DEFAULT_ENCODING) ||
  // EUC_JP.equalsIgnoreCase(PLATFORM_DEFAULT_ENCODING);


  /**
   * Decodes bytes bytes array as returned by getBytes().
   * @param {Int8Array} bytes sequence of given charset.
   * @param {string=} opt_charset name of charset.
   * @return {string} decoded string.
   */
  _.bytesToString = function(bytes, opt_charset) {
    var charset = opt_charset || _.UTF8;
    var str = null;

    // try native TextDecoder first
    if (self.TextDecoder && self.Uint8Array && self.Uint8Array['from']) {
      try {
        let decoder = new self.TextDecoder(charset);
        return decoder.decode(self.Uint8Array['from'](bytes));
      } catch (ignored) {
        // try other methods if charset is not supported by native decoder (eg. CP437 on Chrome).
      }
    }
    if (charset === _.UTF8) {
      str = utf8.UTF8BytesToString(bytes);
    } else if (iconvlite.isSupported(charset)) {
      str = iconvlite.toString(bytes, charset);
    } else {
      if (!iconv)
        throw new InvalidCharsetException(
          'iconv not loaded, cannot handle ' + charset);
      /** @type {Int8Array} */
      let utf8Bytes = iconv.convert(bytes, charset, _.UTF8);
      if (utf8Bytes === null)
        throw new InvalidCharsetException(
          'toStr ' + charset + ' to UTF-8 ' + bytes);
      bytes = utf8Bytes;
      str = utf8.UTF8BytesToString(bytes);
    }
    if (str === null) {
      throw new InvalidCharsetException();
    }
    return str;
  };

  /**
   * Note: charset is currently ignored.
   * Decodes bytes bytes array as returned by getBytes().
   * @param {string} str to encode.
   * @param {string=} opt_charset name of charset.
   * @return {Int8Array} bytes.
   */
  _.stringToBytes = function(str, opt_charset) {
    var charset = opt_charset || _.UTF8;
    /** @type {Int8Array} */
    var bytes = null;
    if (charset === _.UTF8) {
      bytes = utf8.stringToUTF8Bytes(str);
      if (bytes === null) {
        throw new InvalidCharsetException();
      }
    } else if (iconvlite.isSupported(charset)) {
      bytes = iconvlite.toBytes(str, charset);
    } else {
      bytes = utf8.stringToUTF8Bytes(str);
      if (!iconv) {
        throw new InvalidCharsetException('iconv not loaded');
      }
      bytes = iconv.convert(bytes, _.UTF8, charset);
    }
    if (bytes === null) {
      throw new InvalidCharsetException(charset + ' to bytes: ' + str);
    }
    return bytes;
  };

  /**
   * @param {Int8Array} bytes bytes encoding a string, whose encoding
   * should be guessed.
   * @param {Object<DecodeHintType,*>=} opt_hints decode hints if applicable.
   * @return {string} name of guessed encoding; at the moment will only
   * guess one of:
   *  {@link #SHIFT_JIS}, {@link #UTF8}, {@link #ISO88591}, or the platform
   *  default encoding if none of these can possibly be correct.
   */
  _.guessEncoding = function(bytes, opt_hints) {
    if (opt_hints && !!opt_hints[DecodeHintType.CHARACTER_SET]) {
      var characterSet = opt_hints[DecodeHintType.CHARACTER_SET].toString();
      if (characterSet) {
        return characterSet;
      }
    }
    // For now, merely tries to distinguish ISO-8859-1, UTF-8 and Shift_JIS,
    // which should be by far the most common encodings.
    var length = bytes.length;
    var canBeISO88591 = true;
    var canBeShiftJIS = true;
    var canBeUTF8 = true;
    var utf8BytesLeft = 0;
    //var utf8LowChars = 0;
    var utf2BytesChars = 0;
    var utf3BytesChars = 0;
    var utf4BytesChars = 0;
    var sjisBytesLeft = 0;
    //var sjisLowChars = 0;
    var sjisKatakanaChars = 0;
    //var sjisDoubleBytesChars = 0;
    var sjisCurKatakanaWordLength = 0;
    var sjisCurDoubleBytesWordLength = 0;
    var sjisMaxKatakanaWordLength = 0;
    var sjisMaxDoubleBytesWordLength = 0;
    //var isoLowChars = 0;
    //var isoHighChars = 0;
    var isoHighOther = 0;

    var utf8bom = bytes.length > 3 &&
      bytes[0] === 0xEF &&
      bytes[1] === 0xBB &&
      bytes[2] === 0xBF;

    for (let i = 0;
         i < length && (canBeISO88591 || canBeShiftJIS || canBeUTF8);
         i++) {

      let value = bytes[i] & 0xFF;

      // UTF-8 stuff
      if (canBeUTF8) {
        if (utf8BytesLeft > 0) {
          if ((value & 0x80) === 0) {
            canBeUTF8 = false;
          } else {
            utf8BytesLeft--;
          }
        } else if ((value & 0x80) !== 0) {
          if ((value & 0x40) === 0) {
            canBeUTF8 = false;
          } else {
            utf8BytesLeft++;
            if ((value & 0x20) === 0) {
              utf2BytesChars++;
            } else {
              utf8BytesLeft++;
              if ((value & 0x10) === 0) {
                utf3BytesChars++;
              } else {
                utf8BytesLeft++;
                if ((value & 0x08) === 0) {
                  utf4BytesChars++;
                } else {
                  canBeUTF8 = false;
                }
              }
            }
          }
        } //else {
        //utf8LowChars++;
        //}
      }

      // ISO-8859-1 stuff
      if (canBeISO88591) {
        if (value > 0x7F && value < 0xA0) {
          canBeISO88591 = false;
        } else if (value > 0x9F) {
          if (value < 0xC0 || value === 0xD7 || value === 0xF7) {
            isoHighOther++;
          } //else {
          //isoHighChars++;
          //}
        } //else {
        //isoLowChars++;
        //}
      }

      // Shift_JIS stuff
      if (canBeShiftJIS) {
        if (sjisBytesLeft > 0) {
          if (value < 0x40 || value === 0x7F || value > 0xFC) {
            canBeShiftJIS = false;
          } else {
            sjisBytesLeft--;
          }
        } else if (value === 0x80 || value === 0xA0 || value > 0xEF) {
          canBeShiftJIS = false;
        } else if (value > 0xA0 && value < 0xE0) {
          sjisKatakanaChars++;
          sjisCurDoubleBytesWordLength = 0;
          sjisCurKatakanaWordLength++;
          if (sjisCurKatakanaWordLength > sjisMaxKatakanaWordLength) {
            sjisMaxKatakanaWordLength = sjisCurKatakanaWordLength;
          }
        } else if (value > 0x7F) {
          sjisBytesLeft++;
          //sjisDoubleBytesChars++;
          sjisCurKatakanaWordLength = 0;
          sjisCurDoubleBytesWordLength++;
          if (sjisCurDoubleBytesWordLength > sjisMaxDoubleBytesWordLength) {
            sjisMaxDoubleBytesWordLength = sjisCurDoubleBytesWordLength;
          }
        } else {
          //sjisLowChars++;
          sjisCurKatakanaWordLength = 0;
          sjisCurDoubleBytesWordLength = 0;
        }
      }
    }

    if (canBeUTF8 && utf8BytesLeft > 0) {
      canBeUTF8 = false;
    }
    if (canBeShiftJIS && sjisBytesLeft > 0) {
      canBeShiftJIS = false;
    }

    // Easy -- if there is BOM or at least 1 valid not-single byte character
    // (and no evidence it can't be UTF-8), done
    if (canBeUTF8 &&
      (utf8bom || utf2BytesChars + utf3BytesChars + utf4BytesChars > 0)) {
      return _.UTF8;
    }
    // Easy -- if assuming Shift_JIS or at least 3 valid consecutive not-ascii
    // characters (and no evidence it can't be), done
    if (canBeShiftJIS &&
      (_.ASSUME_SHIFT_JIS || sjisMaxKatakanaWordLength >= 3 ||
        sjisMaxDoubleBytesWordLength >= 3)) {
      return _.SHIFT_JIS;
    }
    // Distinguishing Shift_JIS and ISO-8859-1 can be a little tough for short
    // words. The crude heuristic is:
    // - If we saw
    //   - only two consecutive katakana chars in the whole text, or
    //   - at least 10% of bytes that could be "upper" not-alphanumeric Latin1,
    // - then we conclude Shift_JIS, else ISO-8859-1
    if (canBeISO88591 && canBeShiftJIS) {
      return (sjisMaxKatakanaWordLength === 2 && sjisKatakanaChars === 2) ||
        isoHighOther * 10 >= length ? _.SHIFT_JIS : _.ISO88591;
    }

    // Otherwise, try in order ISO-8859-1, Shift JIS, UTF-8 and fall back to
    // default platform encoding
    if (canBeISO88591) {
      return _.ISO88591;
    }
    if (canBeShiftJIS) {
      return _.SHIFT_JIS;
    }
    if (canBeUTF8) {
      return _.UTF8;
    }
    // Otherwise, we take a wild guess with platform encoding
    return _.PLATFORM_DEFAULT_ENCODING;
  };
});
