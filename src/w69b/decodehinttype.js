// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/*
 * Copyright 2007 ZXing authors
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
goog.provide('w69b.DecodeHintType');

/**
 * Decode hint key constants.
 * @enum {number}
 */
w69b.DecodeHintType = {
  OTHER: 0,
  PURE_BARCODE: 1,
  POSSIBLE_FORMATS: 2,
  TRY_HARDER: 3,
  CHARACTER_SET: 4,
  ALLOWED_LENGTHS: 5,
  ASSUME_CODE_39_CHECK_DIGIT: 6,
  RETURN_CODABAR_START_END: 7,
  ASSUME_GS1: 8,
  NEED_RESULT_POINT_CALLBACK: 9
};
